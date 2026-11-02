import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { SRI_LANKA_DISTRICTS } from "../constants/districts";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rakiya_abimana_jwt_super_secret_key_2026_lk";

const ALLOWED_REGISTER_ROLES: Role[] = [
  Role.JobSeeker,
  Role.Entrepreneur,
  Role.Employer,
  Role.Funder,
  Role.TrainingProvider
];

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      dateOfBirth,
      phone,
      districtId,
      roles,
      preferredLanguage = "en",
      termsAccepted
    } = req.body;

    // Consent checkbox validation
    if (!termsAccepted) {
      return res.status(400).json({
        error: "You must accept the Terms of Service and Privacy Notice to register."
      });
    }

    if (!email || !password || !fullName || !dateOfBirth) {
      return res.status(400).json({ error: "Missing required fields: email, password, fullName, and dateOfBirth are mandatory." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    // Role validation: Admin and Verifier accounts cannot be self-registered
    const requestedRoles: Role[] = Array.isArray(roles) && roles.length > 0 ? roles : [Role.JobSeeker];
    const invalidRoles = requestedRoles.filter((r) => !ALLOWED_REGISTER_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        error: `Cannot self-register for restricted role(s): ${invalidRoles.join(", ")}. Verifier and Admin accounts are created by an administrator.`
      });
    }

    // Lookup default district coordinates if provided
    let lat: number | undefined;
    let lng: number | undefined;
    if (districtId) {
      const dist = SRI_LANKA_DISTRICTS.find((d) => d.id === districtId);
      if (dist) {
        lat = dist.lat;
        lng = dist.lng;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const dob = new Date(dateOfBirth);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        dateOfBirth: dob,
        phone: phone?.trim(),
        districtId,
        lat,
        lng,
        preferredLanguage,
        termsAcceptedAt: new Date(),
        roles: {
          create: requestedRoles.map((r) => ({ role: r }))
        }
      },
      include: {
        roles: true,
        district: true
      }
    });

    const token = generateToken(newUser.id);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        dateOfBirth: newUser.dateOfBirth,
        phone: newUser.phone,
        districtId: newUser.districtId,
        district: newUser.district,
        preferredLanguage: newUser.preferredLanguage,
        isVerified: newUser.isVerified,
        roles: newUser.roles.map((r) => r.role)
      }
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Failed to complete registration" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        roles: true,
        district: true,
        verificationRequest: {
          select: { status: true, rejectionReason: true, dobMatch: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact an administrator." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);
    setAuthCookie(res, token);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        districtId: user.districtId,
        district: user.district,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,
        roles: user.roles.map((r) => r.role),
        verification: user.verificationRequest
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  return res.json({ message: "Successfully logged out" });
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        roles: true,
        district: true,
        jobSeekerProfile: true,
        employerProfile: true,
        funderProfile: true,
        verificationRequest: {
          select: {
            status: true,
            rejectionReason: true,
            dobMatch: true,
            nicFormat: true,
            reviewedAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        districtId: user.districtId,
        district: user.district,
        lat: user.lat,
        lng: user.lng,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,
        roles: user.roles.map((r) => r.role),
        jobSeekerProfile: user.jobSeekerProfile,
        employerProfile: user.employerProfile,
        funderProfile: user.funderProfile,
        verification: user.verificationRequest
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user session" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fullName, phone, districtId, preferredLanguage, lat, lng } = req.body;

    let finalLat = lat;
    let finalLng = lng;
    if (districtId && (lat === undefined || lng === undefined)) {
      const dist = SRI_LANKA_DISTRICTS.find((d) => d.id === districtId);
      if (dist) {
        finalLat = dist.lat;
        finalLng = dist.lng;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone !== undefined ? phone : undefined,
        districtId: districtId !== undefined ? districtId : undefined,
        preferredLanguage: preferredLanguage || undefined,
        lat: finalLat !== undefined ? finalLat : undefined,
        lng: finalLng !== undefined ? finalLng : undefined
      },
      include: {
        roles: true,
        district: true
      }
    });

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        districtId: updatedUser.districtId,
        district: updatedUser.district,
        preferredLanguage: updatedUser.preferredLanguage,
        isVerified: updatedUser.isVerified,
        roles: updatedUser.roles.map((r) => r.role)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// PUT /api/auth/password
router.put("/password", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update password" });
  }
});

export default router;

