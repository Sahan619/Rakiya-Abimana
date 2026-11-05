import { Router, Request, Response } from "express";
import { PrismaClient, PitchStatus, FundingType } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";
import { hasPermission } from "../config/permissions";
import { translateWithCache } from "../services/translation.service";
import { createNotification } from "../services/notification.service";
import { logAuditAction } from "../services/audit.service";

const router = Router();
const prisma = new PrismaClient();

// Helper to translate pitch fields
async function enrichPitchWithTranslation(prismaClient: PrismaClient, pitch: any, targetLang = "en") {
  const sourceLang = pitch.sourceLanguage || "en";
  let title = pitch.title;
  let story = pitch.story;
  let isMachineTranslated = false;

  if (targetLang && targetLang !== sourceLang) {
    const titleTrans = await translateWithCache(prismaClient, pitch.title, sourceLang, targetLang);
    const storyTrans = await translateWithCache(prismaClient, pitch.story, sourceLang, targetLang);
    title = titleTrans.text;
    story = storyTrans.text;
    isMachineTranslated = true;
  }

  return {
    ...pitch,
    title,
    story,
    originalTitle: pitch.title,
    originalStory: pitch.story,
    sourceLanguage: sourceLang,
    isMachineTranslated
  };
}

// GET /api/pitches - Browse verified pitches (Funders & Public browse by district only; unverified never visible)
router.get("/", authenticateToken, requirePermission("pitch:browse_approved"), async (req: Request, res: Response) => {
  try {
    const { districtId, sectorId, fundingType, lang = req.user?.preferredLanguage || "en" } = req.query;

    // FUNDERS & PUBLIC: strictly only APPROVED pitches
    const whereClause: any = {
      status: PitchStatus.APPROVED
    };

    if (districtId) {
      whereClause.districtId = String(districtId);
    }
    if (sectorId) {
      whereClause.sectorId = String(sectorId);
    }
    if (fundingType) {
      whereClause.fundingType = fundingType as FundingType;
    }

    const pitches = await prisma.pitch.findMany({
      where: whereClause,
      include: {
        district: true,
        sector: true,
        entrepreneur: {
          select: {
            id: true,
            fullName: true,
            isVerified: true
          }
        },
        _count: {
          select: { interests: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const enriched = await Promise.all(
      pitches.map((p) => enrichPitchWithTranslation(prisma, p, String(lang)))
    );

    return res.json({ pitches: enriched, count: enriched.length });
  } catch (err) {
    console.error("Browse pitches error:", err);
    return res.status(500).json({ error: "Failed to fetch micro-business pitches" });
  }
});

// GET /api/pitches/my - Entrepreneur view own pitches
router.get("/my", authenticateToken, requirePermission("pitch:manage_own"), async (req: Request, res: Response) => {
  try {
    const pitches = await prisma.pitch.findMany({
      where: { entrepreneurId: req.user!.id },
      include: {
        district: true,
        sector: true,
        interests: {
          include: {
            funder: {
              select: {
                id: true,
                fullName: true,
                isVerified: true,
                funderProfile: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ pitches });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch your pitches" });
  }
});

// GET /api/pitches/verifier/queue - Verifiers review pending pitches
router.get(
  "/verifier/queue",
  authenticateToken,
  requirePermission("pitch:review"),
  async (req: Request, res: Response) => {
    try {
      const pitches = await prisma.pitch.findMany({
        where: { status: PitchStatus.PENDING_REVIEW },
        include: {
          district: true,
          sector: true,
          entrepreneur: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              isVerified: true,
              district: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      });

      return res.json({ queue: pitches });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch verifier pitch queue" });
    }
  }
);

// GET /api/pitches/:id - Single pitch detail
router.get(
  "/:id",
  authenticateToken,
  requirePermission("pitch:browse_approved", "pitch:manage_own", "pitch:review"),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lang = String(req.query.lang || req.user?.preferredLanguage || "en");

    const pitch = await prisma.pitch.findUnique({
      where: { id },
      include: {
        district: true,
        sector: true,
        entrepreneur: {
          select: {
            id: true,
            fullName: true,
            isVerified: true,
            district: true
          }
        },
        interests: {
          include: {
            funder: {
              select: {
                id: true,
                fullName: true,
                funderProfile: true
              }
            }
          }
        }
      }
      }
    );

    if (!pitch) {
      return res.status(404).json({ error: "Pitch not found" });
    }

    // Security check: pitch details are available to owners or users with the relevant read permission.
    const isOwner = req.user?.id === pitch.entrepreneurId;
    const canManageOwn = Boolean(req.user && hasPermission(req.user.roles, "pitch:manage_own"));
    const canBrowse = Boolean(req.user && hasPermission(req.user.roles, "pitch:browse_approved"));
    const canReview = Boolean(req.user && hasPermission(req.user.roles, "pitch:review"));

    if (
      (pitch.status === PitchStatus.APPROVED && !canBrowse && !(isOwner && canManageOwn)) ||
      (pitch.status !== PitchStatus.APPROVED && !(isOwner && canManageOwn) && !canReview)
    ) {
      return res.status(403).json({ error: "This pitch is pending verification and is not yet publicly visible." });
    }

    const enriched = await enrichPitchWithTranslation(prisma, pitch, lang);
    return res.json({ pitch: enriched });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pitch details" });
  }
});

// POST /api/pitches - Must be verified before submitting a pitch
router.post(
  "/",
  authenticateToken,
  requirePermission("pitch:create"),
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        story,
        districtId,
        sectorId,
        fundingNeeded,
        fundingType = FundingType.MICRO_LOAN,
        sourceLanguage = "en"
      } = req.body;

      if (!title || !story || !districtId || !fundingNeeded) {
        return res.status(400).json({
          error: "Title, story, district, and funding needed amount are required."
        });
      }

      const pitch = await prisma.pitch.create({
        data: {
          entrepreneurId: req.user!.id,
          title: title.trim(),
          story: story.trim(),
          districtId,
          sectorId: sectorId || null,
          fundingNeeded: parseFloat(fundingNeeded),
          fundingType: fundingType as FundingType,
          status: PitchStatus.PENDING_REVIEW,
          sourceLanguage
        },
        include: { district: true, sector: true }
      });

      // Translation pipeline: pre-cache
      const otherLangs = ["en", "si", "ta"].filter((l) => l !== sourceLanguage);
      for (const tLang of otherLangs) {
        await translateWithCache(prisma, pitch.title, sourceLanguage, tLang);
        await translateWithCache(prisma, pitch.story, sourceLanguage, tLang);
      }

      await logAuditAction(prisma, {
        action: "PITCH_SUBMITTED",
        actorId: req.user!.id,
        targetType: "Pitch",
        targetId: pitch.id,
        details: { title: pitch.title, fundingNeeded: pitch.fundingNeeded, fundingType: pitch.fundingType }
      });

      return res.status(201).json({
        message: "Micro-business pitch submitted successfully for verifier review.",
        pitch
      });
    } catch (err) {
      console.error("Pitch submit error:", err);
      return res.status(500).json({ error: "Failed to create pitch" });
    }
  }
);

// POST /api/pitches/:id/review - Verifier reviews pitch
router.post(
  "/:id/review",
  authenticateToken,
  requirePermission("pitch:review"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { decision, rejectionReason, checklist } = req.body;

      if (!decision || (decision !== "APPROVE" && decision !== "REJECT")) {
        return res.status(400).json({ error: "Decision must be 'APPROVE' or 'REJECT'." });
      }

      if (decision === "REJECT" && (!rejectionReason || !rejectionReason.trim())) {
        return res.status(400).json({ error: "Rejection reason is mandatory when rejecting a pitch." });
      }

      const pitch = await prisma.pitch.findUnique({
        where: { id },
        include: { entrepreneur: true }
      });

      if (!pitch) {
        return res.status(404).json({ error: "Pitch not found" });
      }

      const isApproved = decision === "APPROVE";
      const newStatus = isApproved ? PitchStatus.APPROVED : PitchStatus.REJECTED;

      const updated = await prisma.pitch.update({
        where: { id },
        data: {
          status: newStatus,
          rejectionReason: isApproved ? null : rejectionReason.trim(),
          checklistResult: checklist ? JSON.stringify(checklist) : undefined
        }
      });

      await logAuditAction(prisma, {
        action: isApproved ? "PITCH_APPROVED" : "PITCH_REJECTED",
        actorId: req.user!.id,
        targetType: "Pitch",
        targetId: id,
        details: { rejectionReason, checklist }
      });

      await createNotification(prisma, {
        userId: pitch.entrepreneurId,
        type: "SYSTEM",
        title: isApproved ? "Business Pitch Published" : "Business Pitch Declined",
        message: isApproved
          ? `Your business pitch "${pitch.title}" has been approved and published to funders!`
          : `Your business pitch "${pitch.title}" was not approved. Reason: ${rejectionReason}`,
        link: `/pitches/${pitch.id}`
      });

      return res.json({
        message: isApproved ? "Pitch approved and published" : "Pitch rejected",
        pitch: updated
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to review pitch" });
    }
  }
);

// POST /api/pitches/:id/interest - Funder expresses interest/pledge (strictly no money movement)
router.post(
  "/:id/interest",
  authenticateToken,
  requirePermission("pitch:express_interest"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { pledgeAmount, message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message expressing your interest is required." });
      }

      const pitch = await prisma.pitch.findUnique({
        where: { id },
        include: { entrepreneur: true }
      });

      if (!pitch || pitch.status !== PitchStatus.APPROVED) {
        return res.status(400).json({ error: "Pledges can only be made on verified, approved pitches." });
      }

      if (pitch.entrepreneurId === req.user!.id) {
        return res.status(400).json({ error: "You cannot pledge on your own pitch." });
      }

      const interest = await prisma.pitchInterest.create({
        data: {
          pitchId: id,
          funderId: req.user!.id,
          pledgeAmount: pledgeAmount ? parseFloat(pledgeAmount) : null,
          message: message.trim()
        }
      });

      // Notify Entrepreneur
      await createNotification(prisma, {
        userId: pitch.entrepreneurId,
        type: "PLEDGE",
        title: "New Funder Interest!",
        message: `${req.user!.fullName} expressed interest in your pitch "${pitch.title}".`,
        link: `/pitches/${pitch.id}`
      });

      return res.status(201).json({
        message: "Interest and pledge details registered successfully. No direct payments are processed on this platform.",
        interest
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to express funding interest" });
    }
  }
);

export default router;
