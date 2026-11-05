import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";
import { roundCoordinates } from "../services/geo.service";

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/job-seeker-profile
router.get("/job-seeker-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
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
router.post("/job-seeker-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  try {
    const { category, skills, trade, experienceYears, bio, educationQualifications, preferredCategories, preferredLocations, expectedSalary } = req.body;

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
        bio: bio || null,
        educationQualifications: educationQualifications || null,
        preferredCategories: preferredCategories || null,
        preferredLocations: preferredLocations || null,
        expectedSalary: expectedSalary !== undefined && expectedSalary !== "" ? Number(expectedSalary) : null
      },
      create: {
        userId: req.user!.id,
        category,
        skills: Array.isArray(skills) ? skills.join(", ") : skills,
        trade: trade || null,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
        bio: bio || null,
        educationQualifications: educationQualifications || null,
        preferredCategories: preferredCategories || null,
        preferredLocations: preferredLocations || null,
        expectedSalary: expectedSalary !== undefined && expectedSalary !== "" ? Number(expectedSalary) : null
      }
    });

    return res.json({ message: "Job seeker profile saved successfully", profile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save job seeker profile" });
  }
});

// GET /api/users/employer-profile
router.get("/employer-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
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
router.post("/employer-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  try {
    const { companyName, businessRegNumber, description, industry, businessAddress, contactPhone, website } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: "Company name is required." });
    }

    const profile = await prisma.employerProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        companyName,
        businessRegNumber: businessRegNumber || null,
        description: description || null,
        industry: industry || null,
        businessAddress: businessAddress || null,
        contactPhone: contactPhone || null,
        website: website || null
      },
      create: {
        userId: req.user!.id,
        companyName,
        businessRegNumber: businessRegNumber || null,
        description: description || null,
        industry: industry || null,
        businessAddress: businessAddress || null,
        contactPhone: contactPhone || null,
        website: website || null
      }
    });

    return res.json({ message: "Employer profile saved successfully", profile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save employer profile" });
  }
});

// GET /api/users/funder-profile
router.get("/funder-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
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
router.post("/funder-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  try {
    const { accountType, organizationName, organizationType, fundingInterests, funderType, focusDistricts, focusSectors } = req.body;

    if (!funderType) {
      return res.status(400).json({ error: "Funder type is required." });
    }

    const profile = await prisma.funderProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        funderType,
        accountType: accountType || "ORGANIZATION",
        organizationName: organizationName || null,
        organizationType: organizationType || null,
        fundingInterests: fundingInterests || null,
        focusDistricts: Array.isArray(focusDistricts) ? focusDistricts.join(", ") : focusDistricts,
        focusSectors: Array.isArray(focusSectors) ? focusSectors.join(", ") : focusSectors
      },
      create: {
        userId: req.user!.id,
        funderType,
        accountType: accountType || "ORGANIZATION",
        organizationName: organizationName || null,
        organizationType: organizationType || null,
        fundingInterests: fundingInterests || null,
        focusDistricts: Array.isArray(focusDistricts) ? focusDistricts.join(", ") : focusDistricts,
        focusSectors: Array.isArray(focusSectors) ? focusSectors.join(", ") : focusSectors
      }
    });

    return res.json({ message: "Funder profile saved successfully", profile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save funder profile" });
  }
});

router.get("/entrepreneur-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  const profile = await prisma.entrepreneurProfile.findUnique({ where: { userId: req.user!.id } });
  return res.json({ profile: profile || null });
});

router.post("/entrepreneur-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  try {
    const { businessName, businessCategory, businessIdea, businessStage, fundingRequirement, skillsExperience } = req.body;
    const profile = await prisma.entrepreneurProfile.upsert({
      where: { userId: req.user!.id },
      update: { businessName: businessName || null, businessCategory: businessCategory || null, businessIdea: businessIdea || null, businessStage: businessStage || null, fundingRequirement: fundingRequirement !== undefined && fundingRequirement !== "" ? Number(fundingRequirement) : null, skillsExperience: skillsExperience || null },
      create: { userId: req.user!.id, businessName: businessName || null, businessCategory: businessCategory || null, businessIdea: businessIdea || null, businessStage: businessStage || null, fundingRequirement: fundingRequirement !== undefined && fundingRequirement !== "" ? Number(fundingRequirement) : null, skillsExperience: skillsExperience || null }
    });
    return res.json({ message: "Entrepreneur profile saved successfully", profile });
  } catch {
    return res.status(500).json({ error: "Failed to save entrepreneur profile" });
  }
});

router.get("/training-provider-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  const profile = await prisma.trainingProviderProfile.findUnique({ where: { userId: req.user!.id } });
  return res.json({ profile: profile || null });
});

router.post("/training-provider-profile", authenticateToken, requirePermission("profile:manage_own"), async (req: Request, res: Response) => {
  try {
    const { institutionName, trainingCategories, coursesOffered, accreditation, trainingLocation, contactPhone, website } = req.body;
    if (!institutionName?.trim()) return res.status(400).json({ error: "Institution name is required." });
    const profile = await prisma.trainingProviderProfile.upsert({
      where: { userId: req.user!.id },
      update: { institutionName: institutionName.trim(), trainingCategories: trainingCategories || null, coursesOffered: coursesOffered || null, accreditation: accreditation || null, trainingLocation: trainingLocation || null, contactPhone: contactPhone || null, website: website || null },
      create: { userId: req.user!.id, institutionName: institutionName.trim(), trainingCategories: trainingCategories || null, coursesOffered: coursesOffered || null, accreditation: accreditation || null, trainingLocation: trainingLocation || null, contactPhone: contactPhone || null, website: website || null }
    });
    return res.json({ message: "Training provider profile saved successfully", profile });
  } catch {
    return res.status(500).json({ error: "Failed to save training provider profile" });
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
