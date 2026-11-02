import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { roundCoordinates } from "../services/geo.service";

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/job-seeker-profile
router.get("/job-seeker-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: req.user!.id }
    });
    return res.json({ profile: profile || null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch job seeker profile" });
  }
});

// POST /api/users/job-seeker-profile - Upsert job seeker profile
router.post("/job-seeker-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, skills, trade, experienceYears, bio } = req.body;

    if (!category || !skills) {
      return res.status(400).json({ error: "Category and skills are required." });
    }

    const profile = await prisma.jobSeekerProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        category,
        skills: Array.isArray(skills) ? skills.join(", ") : skills,
        trade: trade || null,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
        bio: bio || null
      },
      create: {
        userId: req.user!.id,
        category,
        skills: Array.isArray(skills) ? skills.join(", ") : skills,
        trade: trade || null,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
        bio: bio || null
      }
    });

    return res.json({ message: "Job seeker profile saved successfully", profile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save job seeker profile" });
  }
});

// GET /api/users/employer-profile
router.get("/employer-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: req.user!.id }
    });
    return res.json({ profile: profile || null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch employer profile" });
  }
});

// POST /api/users/employer-profile - Upsert employer profile
router.post("/employer-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { companyName, businessRegNumber, description, website } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: "Company name is required." });
    }

    const profile = await prisma.employerProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        companyName,
        businessRegNumber: businessRegNumber || null,
        description: description || null,
        website: website || null
      },
      create: {
        userId: req.user!.id,
        companyName,
        businessRegNumber: businessRegNumber || null,
        description: description || null,
        website: website || null
      }
    });

    return res.json({ message: "Employer profile saved successfully", profile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save employer profile" });
  }
});

// GET /api/users/funder-profile
router.get("/funder-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.funderProfile.findUnique({
      where: { userId: req.user!.id }
    });
    return res.json({ profile: profile || null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch funder profile" });
  }
});

// POST /api/users/funder-profile - Upsert funder profile
router.post("/funder-profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { funderType, focusDistricts, focusSectors } = req.body;

    if (!funderType) {
      return res.status(400).json({ error: "Funder type is required." });
    }

    const profile = await prisma.funderProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        funderType,
        focusDistricts: Array.isArray(focusDistricts) ? focusDistricts.join(", ") : focusDistricts,
        focusSectors: Array.isArray(focusSectors) ? focusSectors.join(", ") : focusSectors
      },
      create: {
        userId: req.user!.id,
        funderType,
        focusDistricts: Array.isArray(focusDistricts) ? focusDistricts.join(", ") : focusDistricts,
        focusSectors: Array.isArray(focusSectors) ? focusSectors.join(", ") : focusSectors
      }
    });

    return res.json({ message: "Funder profile saved successfully", profile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save funder profile" });
  }
});

// GET /api/users/:id/public - Public safe view
router.get("/:id/public", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        district: true,
        lat: true,
        lng: true,
        isVerified: true,
        employerProfile: {
          select: {
            companyName: true,
            description: true,
            website: true
          }
        },
        jobSeekerProfile: {
          select: {
            category: true,
            skills: true,
            trade: true,
            experienceYears: true,
            bio: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Never expose raw GPS coordinates
    const approxCoords = user.lat && user.lng ? roundCoordinates(user.lat, user.lng) : null;

    return res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        district: user.district,
        approxCoords,
        isVerified: user.isVerified,
        employer: user.employerProfile,
        jobSeeker: user.jobSeekerProfile
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch public profile" });
  }
});

export default router;

