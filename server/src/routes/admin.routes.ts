import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";
import { logAuditAction } from "../services/audit.service";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /api/admin/users - List users
router.get("/users", requirePermission("user:manage"), async (req: Request, res: Response) => {
  try {
    const { search, role, status } = req.query;

    const whereClause: any = {};
    if (status === "active") whereClause.isActive = true;
    if (status === "deactivated") whereClause.isActive = false;

    if (search) {
      whereClause.OR = [
        { fullName: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } }
      ];
    }

    if (role) {
      whereClause.roles = {
        some: { role: role as Role }
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        roles: true,
        district: true,
        verificationRequest: { select: { status: true, dobMatch: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      district: u.district,
      roles: u.roles.map((r) => r.role),
      isVerified: u.isVerified,
      isActive: u.isActive,
      termsAcceptedAt: u.termsAcceptedAt,
      verificationStatus: u.verificationRequest?.status || "NONE",
      createdAt: u.createdAt
    }));

    return res.json({ users: safeUsers, count: safeUsers.length });
  } catch (err) {
    return res.status(500).json({ error: "Failed to list users" });
  }
});

// POST /api/admin/users - Admin creates user (e.g. Verifier or Admin accounts)
router.post("/users", requirePermission("user:manage"), async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, dateOfBirth, phone, districtId, roles } = req.body;

    if (!email || !password || !fullName || !dateOfBirth) {
      return res.status(400).json({ error: "Email, password, fullName, and dateOfBirth are mandatory." });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const assignedRoles: Role[] = Array.isArray(roles) && roles.length > 0 ? roles : [Role.Verifier];
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        phone: phone ? phone.trim() : null,
        districtId: districtId || null,
        isActive: true,
        termsAcceptedAt: new Date(),
        roles: {
          create: assignedRoles.map((r) => ({ role: r }))
        }
      },
      include: { roles: true }
    });

    await logAuditAction(prisma, {
      action: "USER_CREATED_BY_ADMIN",
      actorId: req.user!.id,
      targetType: "User",
      targetId: user.id,
      details: { email: user.email, roles: assignedRoles }
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((r) => r.role)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create user" });
  }
});

// PATCH /api/admin/users/:id/status - Soft delete / deactivate user
router.patch("/users/:id/status", requirePermission("user:manage"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }

    if (id === req.user!.id && !isActive) {
      return res.status(400).json({ error: "Administrators cannot deactivate their own account" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive }
    });

    await logAuditAction(prisma, {
      action: isActive ? "USER_REACTIVATED" : "USER_DEACTIVATED",
      actorId: req.user!.id,
      targetType: "User",
      targetId: id,
      details: { isActive }
    });

    return res.json({
      message: `User account ${isActive ? "activated" : "deactivated (soft deleted)"} successfully`,
      isActive: updated.isActive
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update user account status" });
  }
});

// POST /api/admin/users/:id/roles - Assign or modify roles
router.post("/users/:id/roles", requirePermission("user:manage"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: "At least one role must be assigned" });
    }

    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.createMany({
      data: roles.map((r: Role) => ({ userId: id, role: r }))
    });

    await logAuditAction(prisma, {
      action: "ROLES_ASSIGNED",
      actorId: req.user!.id,
      targetType: "User",
      targetId: id,
      details: { newRoles: roles }
    });

    return res.json({ message: "User roles updated successfully", roles });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update user roles" });
  }
});

// GET /api/admin/audit-logs
router.get("/audit-logs", requirePermission("audit:view"), async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// GET /api/admin/settings
router.get("/settings", requirePermission("settings:manage"), async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" }
    });
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/admin/settings - Update system settings
router.put("/settings", requirePermission("settings:manage"), async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: "Setting key and value are required" });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    await logAuditAction(prisma, {
      action: "SETTING_UPDATED",
      actorId: req.user!.id,
      targetType: "SystemSetting",
      targetId: key,
      details: { key, value }
    });

    return res.json({ message: "Setting updated successfully", setting: updated });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update setting" });
  }
});

export default router;
