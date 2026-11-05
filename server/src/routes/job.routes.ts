import { Router, Request, Response } from "express";
import { PrismaClient, JobStatus, ApplicationStatus } from "@prisma/client";
import { authenticateToken, optionalAuth } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";
import { hasPermission } from "../config/permissions";
import { calculateHaversineDistance, roundCoordinates } from "../services/geo.service";
import {
  detectSourceLanguage,
  isAutoTranslationEnabled,
  translateWithCache
} from "../services/translation.service";
import { SRI_LANKA_DISTRICTS } from "../constants/districts";
import { createNotification } from "../services/notification.service";
import { logAuditAction } from "../services/audit.service";

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_MATCH_RADIUS = parseInt(process.env.MATCH_RADIUS_KM || "50", 10);

// Helper to translate job fields
async function enrichJobWithTranslation(prismaClient: PrismaClient, job: any, targetLang = "en") {
  const sourceLang = job.sourceLanguage || "en";
  let title = job.title;
  let description = job.description;
  let isMachineTranslated = false;

  if (targetLang && targetLang !== sourceLang) {
    const titleTrans = await translateWithCache(prismaClient, job.title, sourceLang, targetLang);
    const descTrans = await translateWithCache(prismaClient, job.description, sourceLang, targetLang);
    title = titleTrans.text;
    description = descTrans.text;
    isMachineTranslated = titleTrans.isMachineTranslated || descTrans.isMachineTranslated;
  }

  const approxCoords = roundCoordinates(job.lat, job.lng);

  return {
    ...job,
    title,
    description,
    originalTitle: job.title,
    originalDescription: job.description,
    sourceLanguage: sourceLang,
    isMachineTranslated,
    lat: approxCoords.lat,
    lng: approxCoords.lng
  };
}

// GET /api/jobs - Browse jobs with search & filters
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    if (req.user && !hasPermission(req.user.roles, "job:list_public")) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    const {
      districtId,
      category,
      minWage,
      maxWage,
      search,
      lang = req.user?.preferredLanguage || "en"
    } = req.query;

    const whereClause: any = {
      status: JobStatus.OPEN
    };

    if (districtId) {
      whereClause.districtId = String(districtId);
    }
    if (category) {
      whereClause.category = String(category);
    }
    if (minWage) {
      whereClause.wage = { ...whereClause.wage, gte: parseFloat(String(minWage)) };
    }
    if (maxWage) {
      whereClause.wage = { ...whereClause.wage, lte: parseFloat(String(maxWage)) };
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } }
      ];
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        district: true,
        employer: {
          select: {
            id: true,
            fullName: true,
            isVerified: true,
            employerProfile: {
              select: { companyName: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const isRestricted = !req.user || !hasPermission(req.user.roles, "job:view_detail");

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const enriched = await enrichJobWithTranslation(prisma, job, String(lang));
        if (isRestricted) {
          // Users without detail access receive the same limited cards as guests.
          return {
            id: enriched.id,
            title: enriched.title,
            originalTitle: enriched.originalTitle,
            district: enriched.district,
            wage: enriched.wage,
            isMachineTranslated: enriched.isMachineTranslated,
            guestRestricted: true
          };
        }
        return {
          ...enriched,
          employer: {
            id: enriched.employer.id,
            companyName: enriched.employer.employerProfile?.companyName || enriched.employer.fullName,
            isVerified: enriched.employer.isVerified
          },
          guestRestricted: false
        };
      })
    );

    return res.json({ jobs: enrichedJobs, total: enrichedJobs.length });
  } catch (err) {
    console.error("Browse jobs error:", err);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /api/jobs/nearby - Geospatial matching with Haversine formula
router.get("/nearby", authenticateToken, requirePermission("job:nearby"), async (req: Request, res: Response) => {
  try {
    let userLat = req.query.lat ? parseFloat(String(req.query.lat)) : req.user?.lat;
    let userLng = req.query.lng ? parseFloat(String(req.query.lng)) : req.user?.lng;
    const radiusKm = req.query.radius ? parseFloat(String(req.query.radius)) : DEFAULT_MATCH_RADIUS;
    const lang = String(req.query.lang || req.user?.preferredLanguage || "en");

    // Fallback to district coordinates if GPS is absent
    if ((!userLat || !userLng) && req.user?.districtId) {
      const dist = SRI_LANKA_DISTRICTS.find((d) => d.id === req.user?.districtId);
      if (dist) {
        userLat = dist.lat;
        userLng = dist.lng;
      }
    }

    if (!userLat || !userLng) {
      return res.status(400).json({
        error: "Location coordinates or user district are required for nearby job matching."
      });
    }

    const openJobs = await prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      include: {
        district: true,
        employer: {
          select: {
            id: true,
            fullName: true,
            isVerified: true,
            employerProfile: { select: { companyName: true } }
          }
        }
      }
    });

    const matchingJobs: any[] = [];

    for (const job of openJobs) {
      const distance = calculateHaversineDistance(userLat, userLng, job.lat, job.lng);
      if (distance <= radiusKm) {
        const enriched = await enrichJobWithTranslation(prisma, job, lang);
        if (hasPermission(req.user!.roles, "job:view_detail")) {
          matchingJobs.push({
            ...enriched,
            distanceKm: distance,
            employer: {
              id: enriched.employer.id,
              companyName: enriched.employer.employerProfile?.companyName || enriched.employer.fullName,
              isVerified: enriched.employer.isVerified
            }
          });
        } else {
          matchingJobs.push({
            id: enriched.id,
            title: enriched.title,
            originalTitle: enriched.originalTitle,
            district: enriched.district,
            wage: enriched.wage,
            distanceKm: distance,
            isMachineTranslated: enriched.isMachineTranslated,
            guestRestricted: true
          });
        }
      }
    }

    // Sort by distance ascending
    matchingJobs.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({
      nearbyJobs: matchingJobs,
      radiusKm,
      count: matchingJobs.length
    });
  } catch (err) {
    console.error("Nearby jobs error:", err);
    return res.status(500).json({ error: "Failed to calculate nearby jobs" });
  }
});

// GET /api/jobs/:id - Single job detail
router.get("/:id", authenticateToken, requirePermission("job:view_detail"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lang = String(req.query.lang || req.user?.preferredLanguage || "en");

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        district: true,
        employer: {
          select: {
            id: true,
            fullName: true,
            isVerified: true,
            employerProfile: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    const enriched = await enrichJobWithTranslation(prisma, job, lang);
    const isGuest = !req.user;

    // Check if user has already applied
    let hasApplied = false;
    let applicationDetails = null;
    if (req.user && hasPermission(req.user.roles, "application:view_own")) {
      const app = await prisma.jobApplication.findUnique({
        where: {
          jobId_applicantId: {
            jobId: id,
            applicantId: req.user.id
          }
        }
      });
      if (app) {
        hasApplied = true;
        applicationDetails = app;
      }
    }

    return res.json({
      job: {
        ...enriched,
        guestRestricted: isGuest,
        employer: {
          id: enriched.employer.id,
          companyName: enriched.employer.employerProfile?.companyName || enriched.employer.fullName,
          description: enriched.employer.employerProfile?.description,
          website: enriched.employer.employerProfile?.website,
          isVerified: enriched.employer.isVerified
        }
      },
      hasApplied,
      application: applicationDetails
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch job details" });
  }
});

// POST /api/jobs - Only verified employers can publish a job
router.post(
  "/",
  authenticateToken,
  requirePermission("job:create"),
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        category,
        districtId,
        wage,
        wageType = "MONTHLY",
        description,
        sourceLanguage = "en",
        lat,
        lng
      } = req.body;

      if (!title || !category || !districtId || !wage || !description) {
        return res.status(400).json({ error: "Title, category, district, wage, and description are required." });
      }
      const detectedSourceLanguage = detectSourceLanguage(
        `${title.trim()} ${description.trim()}`,
        sourceLanguage
      );

      // Default lat/lng from district if not provided
      let finalLat = lat ? parseFloat(lat) : undefined;
      let finalLng = lng ? parseFloat(lng) : undefined;

      if (finalLat === undefined || finalLng === undefined) {
        const dist = SRI_LANKA_DISTRICTS.find((d) => d.id === districtId);
        if (dist) {
          finalLat = dist.lat;
          finalLng = dist.lng;
        } else {
          finalLat = 6.9271;
          finalLng = 79.8612;
        }
      }

      const job = await prisma.job.create({
        data: {
          employerId: req.user!.id,
          title: title.trim(),
          category,
          districtId,
          wage: parseFloat(wage),
          wageType,
          description: description.trim(),
          sourceLanguage: detectedSourceLanguage,
          lat: finalLat,
          lng: finalLng,
          status: JobStatus.OPEN
        },
        include: { district: true }
      });

      // Translation Pipeline: Pre-cache translations in other languages
      const targetLangs = ["en", "si", "ta"].filter((l) => l !== detectedSourceLanguage);
      for (const tLang of targetLangs) {
        await translateWithCache(prisma, job.title, detectedSourceLanguage, tLang);
        await translateWithCache(prisma, job.description, detectedSourceLanguage, tLang);
      }

      await logAuditAction(prisma, {
        action: "JOB_PUBLISHED",
        actorId: req.user!.id,
        targetType: "Job",
        targetId: job.id,
        details: { title: job.title, districtId: job.districtId, wage: job.wage }
      });

      return res.status(201).json({
        message: isAutoTranslationEnabled()
          ? "Job published successfully with automated multilingual translations."
          : "Job published successfully.",
        job
      });
    } catch (err) {
      console.error("Publish job error:", err);
      return res.status(500).json({ error: "Failed to publish job" });
    }
  }
);

// PUT /api/jobs/:id - Edit job
router.put(
  "/:id",
  authenticateToken,
  requirePermission("job:manage_own"),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.job.findUnique({
      where: { id },
      include: { district: true }
    });

    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (existing.employerId !== req.user!.id) {
      return res.status(403).json({ error: "You can only edit your own job postings" });
    }

    const { title, category, districtId, wage, wageType, description } = req.body;

    // Validate title if supplied
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 3) {
        return res.status(400).json({ error: "Job title must be at least 3 characters long." });
      }
    }

    // Validate category if supplied
    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({ error: "Job category cannot be empty." });
      }
    }

    // Validate district if supplied
    let newLat: number | undefined = undefined;
    let newLng: number | undefined = undefined;
    if (districtId !== undefined) {
      const dist = SRI_LANKA_DISTRICTS.find((d) => d.id === districtId);
      if (!dist) {
        return res.status(400).json({ error: "Invalid district selected." });
      }
      newLat = dist.lat;
      newLng = dist.lng;
    }

    // Validate wage if supplied
    let parsedWage: number | undefined = undefined;
    if (wage !== undefined) {
      parsedWage = typeof wage === "number" ? wage : parseFloat(String(wage));
      if (!Number.isFinite(parsedWage) || parsedWage < 0) {
        return res.status(400).json({ error: "Offered wage must be a non-negative number." });
      }
    }

    // Validate wageType if supplied
    const validWageTypes = ["MONTHLY", "DAILY", "PIECE_RATE", "HOURLY"];
    if (wageType !== undefined && !validWageTypes.includes(wageType)) {
      return res.status(400).json({ error: "Wage basis must be MONTHLY, DAILY, PIECE_RATE, or HOURLY." });
    }

    // Validate description if supplied
    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 10) {
        return res.status(400).json({ error: "Job description must be at least 10 characters long." });
      }
    }

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDescription = description !== undefined ? description.trim() : existing.description;
    const titleChanged = newTitle !== existing.title;
    const descChanged = newDescription !== existing.description;
    const sourceLang = titleChanged || descChanged
      ? detectSourceLanguage(`${newTitle} ${newDescription}`, existing.sourceLanguage || "en")
      : existing.sourceLanguage || "en";

    const updated = await prisma.job.update({
      where: { id },
      data: {
        title: titleChanged ? newTitle : undefined,
        category: category || undefined,
        districtId: districtId || undefined,
        lat: newLat !== undefined ? newLat : undefined,
        lng: newLng !== undefined ? newLng : undefined,
        wage: parsedWage !== undefined ? parsedWage : undefined,
        wageType: wageType || undefined,
        description: descChanged ? newDescription : undefined,
        sourceLanguage: titleChanged || descChanged ? sourceLang : undefined
      },
      include: {
        district: true
      }
    });

    // Translation Pipeline: Update pre-cached translations if title or description changed
    if (titleChanged || descChanged) {
      const targetLangs = ["en", "si", "ta"].filter((l) => l !== sourceLang);
      for (const tLang of targetLangs) {
        if (titleChanged) {
          await translateWithCache(prisma, updated.title, sourceLang, tLang);
        }
        if (descChanged) {
          await translateWithCache(prisma, updated.description, sourceLang, tLang);
        }
      }
    }

    await logAuditAction(prisma, {
      action: "JOB_UPDATED",
      actorId: req.user!.id,
      targetType: "Job",
      targetId: updated.id,
      details: {
        title: updated.title,
        districtId: updated.districtId,
        wage: updated.wage
      }
    });

    return res.json({ message: "Job updated successfully", job: updated });
  } catch (err) {
    console.error("Job update error:", err);
    return res.status(500).json({ error: "Failed to update job" });
  }
  }
);

// PATCH /api/jobs/:id/status - Close or reopen job
router.patch(
  "/:id/status",
  authenticateToken,
  requirePermission("job:manage_own"),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== JobStatus.OPEN && status !== JobStatus.CLOSED)) {
      return res.status(400).json({ error: "Status must be OPEN or CLOSED" });
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.employerId !== req.user!.id) {
      return res.status(403).json({ error: "You can only change status of your own jobs" });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status }
    });

    return res.json({ message: `Job ${status.toLowerCase()} successfully`, job: updated });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update job status" });
  }
  }
);

// POST /api/jobs/:id/apply - Apply for job
router.post(
  "/:id/apply",
  authenticateToken,
  requirePermission("job:apply"),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { employer: true }
    });

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    if (job.status !== JobStatus.OPEN) {
      return res.status(400).json({ error: "This job is not currently open for applications." });
    }

    if (job.employerId === req.user!.id) {
      return res.status(400).json({ error: "You cannot apply to your own job posting." });
    }

    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId: id,
          applicantId: req.user!.id
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: "You have already applied for this job." });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        applicantId: req.user!.id,
        notes: notes ? notes.trim() : null,
        status: ApplicationStatus.APPLIED
      }
    });

    // Notify Employer
    await createNotification(prisma, {
      userId: job.employerId,
      type: "APPLICATION",
      title: "New Job Applicant",
      message: `${req.user!.fullName} applied for "${job.title}".`,
      link: `/jobs/${job.id}/applicants`
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (err) {
    console.error("Apply error:", err);
    return res.status(500).json({ error: "Failed to submit application" });
  }
  }
);

// GET /api/jobs/my/applications - Job seeker view own applications
router.get(
  "/my/applications",
  authenticateToken,
  requirePermission("application:view_own"),
  async (req: Request, res: Response) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { applicantId: req.user!.id },
      include: {
        job: {
          include: {
            district: true,
            employer: {
              select: {
                fullName: true,
                isVerified: true,
                employerProfile: { select: { companyName: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ applications });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch your applications" });
  }
  }
);

// GET /api/jobs/my/posted & GET /api/jobs/my - View own posted jobs (Entrepreneur & Employer)
const getMyJobsHandler = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { employerId: req.user!.id },
      include: {
        district: true,
        ...(hasPermission(req.user!.roles, "applicant:view")
          ? { _count: { select: { applications: true } } }
          : {})
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ jobs, total: jobs.length });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch your posted jobs" });
  }
};

router.get(
  "/my/posted",
  authenticateToken,
  requirePermission("job:manage_own"),
  getMyJobsHandler
);
router.get(
  "/my",
  authenticateToken,
  requirePermission("job:manage_own"),
  getMyJobsHandler
);

// GET /api/jobs/:id/applicants - Employer views applicants
router.get(
  "/:id/applicants",
  authenticateToken,
  requirePermission("applicant:view"),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { districtId, skills, category } = req.query;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.employerId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized access to job applicants" });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobId: id },
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            district: true,
            isVerified: true,
            jobSeekerProfile: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    let filtered = applications;
    if (districtId) {
      filtered = filtered.filter((app) => app.applicant.district?.id === districtId);
    }
    if (category) {
      filtered = filtered.filter(
        (app) => app.applicant.jobSeekerProfile?.category === category
      );
    }
    if (skills) {
      const skillTerm = String(skills).toLowerCase();
      filtered = filtered.filter((app) =>
        app.applicant.jobSeekerProfile?.skills?.toLowerCase().includes(skillTerm)
      );
    }

    return res.json({ applicants: filtered, total: filtered.length });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch applicants" });
  }
  }
);

// PATCH /api/jobs/applications/:appId/status - Employer updates applicant status
router.patch(
  "/applications/:appId/status",
  authenticateToken,
  requirePermission("applicant:update_status"),
  async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;

    const application = await prisma.jobApplication.findUnique({
      where: { id: appId },
      include: { job: true }
      }
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.job.employerId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized to update application status" });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: appId },
      data: { status: status as ApplicationStatus }
    });

    // Notify Applicant
    await createNotification(prisma, {
      userId: application.applicantId,
      type: "APPLICATION",
      title: "Application Status Update",
      message: `Your application status for "${application.job.title}" has been updated to ${status}.`,
      link: "/jobs/applications"
    });

    return res.json({ message: "Application status updated successfully", application: updated });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update application status" });
  }
});

export default router;
