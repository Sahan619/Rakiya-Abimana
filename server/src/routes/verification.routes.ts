import { Router, Request, Response } from "express";
import { PrismaClient, VerificationStatus, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/role.middleware";
import { uploadVerificationDocs } from "../middleware/upload.middleware";
import { encryptData, decryptData } from "../services/crypto.service";
import { getVerificationHook } from "../services/nic.service";
import { logAuditAction } from "../services/audit.service";
import { createNotification } from "../services/notification.service";

const router = Router();
const prisma = new PrismaClient();

// POST /api/verification/submit - User submits identity / business verification
router.post(
  "/submit",
  authenticateToken,
  uploadVerificationDocs.fields([
    { name: "gramaNiladhariDoc", maxCount: 1 },
    { name: "businessRegDoc", maxCount: 1 },
    { name: "institutionDoc", maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const { nicNumber } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { roles: true, funderProfile: true }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const roles = user.roles.map((item) => item.role);
      if (roles.includes(Role.Admin) || roles.includes(Role.Verifier)) {
        return res.status(403).json({ error: "Administrative and verifier accounts do not submit public verification applications." });
      }

      const hasNic = typeof nicNumber === "string" && nicNumber.trim().length > 0;
      const hasDocument = Boolean(
        files?.gramaNiladhariDoc?.[0] || files?.businessRegDoc?.[0] || files?.institutionDoc?.[0]
      );

      if (roles.includes(Role.Employer) || roles.includes(Role.Entrepreneur)) {
        if (!hasNic) return res.status(400).json({ error: "NIC is required for Employer and Entrepreneur identity verification." });
      } else if (roles.includes(Role.Funder) && user.funderProfile?.accountType === "INDIVIDUAL" && !hasNic) {
        return res.status(400).json({ error: "NIC is required for individual Funder identity verification." });
      } else if (roles.includes(Role.TrainingProvider) && !hasDocument && !hasNic) {
        return res.status(400).json({ error: "Please provide an institution document or representative identity document." });
      } else if (roles.includes(Role.JobSeeker) && !hasNic && !hasDocument) {
        return res.status(400).json({ error: "Verification is optional, but provide a document or NIC when submitting a request." });
      }

      // 1. Run Verification Hook Interface (Format check & DOB extraction)
      const existingReq = await prisma.verificationRequest.findUnique({
        where: { userId: user.id }
      });

      let hookResult: Awaited<ReturnType<ReturnType<typeof getVerificationHook>["verify"]>> | null = null;
      if (hasNic) {
        const hook = getVerificationHook();
        hookResult = await hook.verify(nicNumber.trim(), user.dateOfBirth);

        if (!hookResult.isFormatValid) {
          return res.status(400).json({
            error: "Invalid Sri Lankan NIC number format.",
            details: hookResult.details
          });
        }
      }

      // 2. Encrypt NIC at rest using AES-256-GCM
      const encryptedNic = hasNic ? encryptData(nicNumber.trim().toUpperCase()) : existingReq?.encryptedNic || null;

      // 3. Process document uploads
      const gramaDocUrl = files?.gramaNiladhariDoc?.[0]
        ? `/uploads/${files.gramaNiladhariDoc[0].filename}`
        : undefined;
      const businessDocUrl = files?.businessRegDoc?.[0]
        ? `/uploads/${files.businessRegDoc[0].filename}`
        : undefined;
      const institutionDocUrl = files?.institutionDoc?.[0]
        ? `/uploads/${files.institutionDoc[0].filename}`
        : undefined;

      // 4. Save verification request with system-calculated DOB match
      const verificationData = {
        encryptedNic,
        nicFormat: hookResult?.format || existingReq?.nicFormat || null,
        dobMatch: hookResult?.dobMatch ?? existingReq?.dobMatch ?? null, // Uneditable system-set value!
        gramaNiladhariDocUrl: gramaDocUrl || existingReq?.gramaNiladhariDocUrl,
        businessRegDocUrl: businessDocUrl || existingReq?.businessRegDocUrl,
        institutionDocUrl: institutionDocUrl || existingReq?.institutionDocUrl,
        status: VerificationStatus.PENDING,
        rejectionReason: null,
        checklistResult: JSON.stringify({
          formatCheckPassed: hookResult?.isFormatValid ?? null,
          dobMatchCalculated: hookResult?.dobMatch ?? null,
          hookUsed: hookResult?.hookName || "DocumentReviewOnly",
          hookDetails: hookResult?.details || "No NIC submitted; documents require manual review."
        })
      };

      const record = await prisma.verificationRequest.upsert({
        where: { userId: user.id },
        update: verificationData,
        create: {
          ...verificationData,
          userId: user.id
        }
      });

      await logAuditAction(prisma, {
        action: "VERIFICATION_SUBMITTED",
        actorId: user.id,
        targetType: "VerificationRequest",
        targetId: record.id,
        details: {
          nicFormat: hookResult?.format || null,
          dobMatch: hookResult?.dobMatch ?? null
        }
      });

      return res.status(201).json({
        message: "Verification documents submitted successfully and are pending review.",
        status: record.status,
        dobMatch: record.dobMatch,
        nicFormat: record.nicFormat
      });
    } catch (err: any) {
      console.error("Verification submit error:", err);
      return res.status(500).json({ error: "Failed to submit verification details" });
    }
  }
);

// GET /api/verification/my-status - User checks own verification status
router.get("/my-status", authenticateToken, async (req: Request, res: Response) => {
  try {
    const record = await prisma.verificationRequest.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        status: true,
        nicFormat: true,
        dobMatch: true,
        rejectionReason: true,
        gramaNiladhariDocUrl: true,
        businessRegDocUrl: true,
        institutionDocUrl: true,
        reviewedAt: true,
        createdAt: true
      }
    });

    return res.json({
      verification: record || null,
      isVerified: req.user!.isVerified
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch verification status" });
  }
});

// GET /api/verification/queue - Verifiers & Admins review pending verifications
router.get(
  "/queue",
  authenticateToken,
  requireRoles(Role.Verifier, Role.Admin),
  async (req: Request, res: Response) => {
    try {
      const { status = "PENDING" } = req.query;

      const requests = await prisma.verificationRequest.findMany({
        where: {
          status: status as VerificationStatus
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
              district: true,
              roles: { select: { role: true } },
              employerProfile: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      });

      // Decrypt raw NIC only for Verifier / Admin
      const enriched = requests.map((item) => {
        let decryptedNic: string | null = null;
        if (item.encryptedNic) {
          try {
            decryptedNic = decryptData(item.encryptedNic);
          } catch {
            decryptedNic = "[DECRYPTION_FAILED]";
          }
        }

        return {
          id: item.id,
          userId: item.userId,
          fullName: item.user.fullName,
          email: item.user.email,
          phone: item.user.phone,
          dateOfBirth: item.user.dateOfBirth,
          district: item.user.district?.nameEn || "N/A",
          roles: item.user.roles.map((r) => r.role),
          employerCompany: item.user.employerProfile?.companyName,
          businessRegNumber: item.user.employerProfile?.businessRegNumber,
          rawNic: decryptedNic, // Only verifier/admin can see this
          nicFormat: item.nicFormat,
          dobMatch: item.dobMatch,
          gramaNiladhariDocUrl: item.gramaNiladhariDocUrl,
          businessRegDocUrl: item.businessRegDocUrl,
          institutionDocUrl: item.institutionDocUrl,
          status: item.status,
          rejectionReason: item.rejectionReason,
          checklistResult: item.checklistResult ? JSON.parse(item.checklistResult) : null,
          createdAt: item.createdAt,
          reviewedAt: item.reviewedAt
        };
      });

      return res.json({ queue: enriched });
    } catch (err) {
      console.error("Queue fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch verification queue" });
    }
  }
);

// POST /api/verification/:id/review - Verifier/Admin approves or rejects
router.post(
  "/:id/review",
  authenticateToken,
  requireRoles(Role.Verifier, Role.Admin),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { decision, rejectionReason, checklist } = req.body;

      if (!decision || (decision !== "APPROVE" && decision !== "REJECT")) {
        return res.status(400).json({ error: "Decision must be either 'APPROVE' or 'REJECT'." });
      }

      if (decision === "REJECT" && (!rejectionReason || !rejectionReason.trim())) {
        return res.status(400).json({ error: "A rejection reason is mandatory when rejecting a verification." });
      }

      const existingReq = await prisma.verificationRequest.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingReq) {
        return res.status(404).json({ error: "Verification request not found" });
      }

      const isApproved = decision === "APPROVE";
      const newStatus = isApproved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

      const updated = await prisma.$transaction([
        prisma.verificationRequest.update({
          where: { id },
          data: {
            status: newStatus,
            rejectionReason: isApproved ? null : rejectionReason.trim(),
            checklistResult: checklist ? JSON.stringify(checklist) : undefined,
            reviewerId: req.user!.id,
            reviewedAt: new Date()
          }
        }),
        prisma.user.update({
          where: { id: existingReq.userId },
          data: {
            isVerified: isApproved
          }
        })
      ]);

      // Log verification decision in audit trail
      await logAuditAction(prisma, {
        action: isApproved ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
        actorId: req.user!.id,
        targetType: "VerificationRequest",
        targetId: id,
        details: {
          userId: existingReq.userId,
          rejectionReason: isApproved ? undefined : rejectionReason,
          checklist
        }
      });

      // Send in-app notification to the applicant
      await createNotification(prisma, {
        userId: existingReq.userId,
        type: "VERIFICATION",
        title: isApproved ? "Identity & Business Verified" : "Verification Request Declined",
        message: isApproved
          ? "Congratulations! Your identity and documents have been verified. You now have the Verified badge."
          : `Your verification request was not approved. Reason: ${rejectionReason}`,
        link: "/verification"
      });

      return res.json({
        message: isApproved ? "User verification approved successfully" : "User verification rejected",
        status: newStatus
      });
    } catch (err) {
      console.error("Review decision error:", err);
      return res.status(500).json({ error: "Failed to process verification decision" });
    }
  }
);

export default router;

