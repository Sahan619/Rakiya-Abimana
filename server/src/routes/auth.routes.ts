import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { SRI_LANKA_DISTRICTS } from "../constants/districts";
import { ROLE_DEFINITIONS, permissionsForRoles } from "../config/permissions";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rakiya_abimana_jwt_super_secret_key_2026_lk";

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function isRole(value: unknown): value is Role {
  return Object.values(Role).some((role) => role === value);
}

function isSelfRegistrableRole(role: Role): boolean {
  const definition = ROLE_DEFINITIONS[role];
  return definition.enabled && definition.selfRegistrable;
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
router.get("/register", (_req: Request, res: Response) => {
  const roles = Object.values(Role)
    .filter(isSelfRegistrableRole)
    .map((role) => ({ value: role, label: ROLE_DEFINITIONS[role].label }));
  return res.json({ roles });
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      dateOfBirth,
      phone,
      districtId,
      roles,
      preferredLanguage = "en",
      termsAccepted,
      jobSeekerProfile,
      employerProfile,
      entrepreneurProfile,
      funderProfile,
      trainingProviderProfile
    } = req.body;

    // Consent checkbox validation
    if (!termsAccepted) {
      return res.status(400).json({
        error: "You must accept the Terms of Service and Privacy Notice to register."
      });
    }

    if (!email || !password || !confirmPassword || !fullName || !dateOfBirth) {
      return res.status(400).json({ error: "Full name, email, password, password confirmation, and date of birth are required." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password and confirmation do not match." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const roleValues: unknown[] = roles === undefined || (Array.isArray(roles) && roles.length === 0)
      ? [Role.JobSeeker]
      : Array.isArray(roles)
        ? roles
        : [];
    if (roleValues.length > 1) {
      return res.status(400).json({ error: "Only one role may be selected during registration." });
    }

    const roleValue = roleValues[0];
    if (!isRole(roleValue) || !isSelfRegistrableRole(roleValue)) {
      return res.status(400).json({
        error: "The selected role is disabled or cannot be self-registered. Verifier and Admin accounts are created by an administrator."
      });
    }

    const requestedRoles: Role[] = [roleValue];
    const hasRole = (role: Role) => requestedRoles.includes(role);
    if (hasRole(Role.Employer) && !employerProfile?.companyName?.trim()) {
      return res.status(400).json({ error: "Company or business name is required for Employer registration." });
    }
    if (hasRole(Role.JobSeeker) && !jobSeekerProfile?.skills?.trim()) {
      return res.status(400).json({ error: "Skills are required for Job Seeker registration." });
    }
    if (hasRole(Role.Funder) && !["INDIVIDUAL", "ORGANIZATION"].includes(String(funderProfile?.accountType || ""))) {
      return res.status(400).json({ error: "Funder account type must be INDIVIDUAL or ORGANIZATION." });
    }
    const numericFields = [
      ["experienceYears", jobSeekerProfile?.experienceYears],
      ["expectedSalary", jobSeekerProfile?.expectedSalary],
      ["fundingRequirement", entrepreneurProfile?.fundingRequirement]
    ] as const;
    const invalidNumericField = numericFields.find(([, value]) => value !== undefined && value !== "" && !Number.isFinite(Number(value)));
    if (invalidNumericField) {
      return res.status(400).json({ error: `${invalidNumericField[0]} must be a valid number.` });
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
    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({ error: "Date of birth must be a valid date." });
    }

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
        },
        jobSeekerProfile: hasRole(Role.JobSeeker) ? {
          create: {
            category: String(jobSeekerProfile?.category || "skilled tradesperson").trim(),
            skills: String(jobSeekerProfile?.skills || "Not provided").trim(),
            trade: jobSeekerProfile?.trade?.trim() || null,
            experienceYears: Number.isFinite(Number(jobSeekerProfile?.experienceYears)) ? Number(jobSeekerProfile.experienceYears) : 0,
            bio: jobSeekerProfile?.bio?.trim() || null,
            educationQualifications: jobSeekerProfile?.educationQualifications?.trim() || null,
            preferredCategories: jobSeekerProfile?.preferredCategories?.trim() || null,
            preferredLocations: jobSeekerProfile?.preferredLocations?.trim() || null,
            expectedSalary: jobSeekerProfile?.expectedSalary !== undefined && jobSeekerProfile?.expectedSalary !== "" ? Number(jobSeekerProfile.expectedSalary) : null
          }
        } : undefined,
        employerProfile: hasRole(Role.Employer) ? {
          create: {
            companyName: employerProfile.companyName.trim(),
            businessRegNumber: employerProfile.businessRegNumber?.trim() || null,
            description: employerProfile.description?.trim() || null,
            industry: employerProfile.industry?.trim() || null,
            businessAddress: employerProfile.businessAddress?.trim() || null,
            contactPhone: employerProfile.contactPhone?.trim() || phone?.trim() || null,
            website: employerProfile.website?.trim() || null
          }
        } : undefined,
        entrepreneurProfile: hasRole(Role.Entrepreneur) ? {
          create: {
            businessName: entrepreneurProfile?.businessName?.trim() || null,
            businessCategory: entrepreneurProfile?.businessCategory?.trim() || null,
            businessIdea: entrepreneurProfile?.businessIdea?.trim() || null,
            businessStage: entrepreneurProfile?.businessStage?.trim() || null,
            fundingRequirement: entrepreneurProfile?.fundingRequirement !== undefined && entrepreneurProfile?.fundingRequirement !== "" ? Number(entrepreneurProfile.fundingRequirement) : null,
            skillsExperience: entrepreneurProfile?.skillsExperience?.trim() || null
          }
        } : undefined,
        funderProfile: hasRole(Role.Funder) ? {
          create: {
            accountType: String(funderProfile.accountType),
            funderType: String(funderProfile.organizationType || "individual").trim(),
            organizationName: funderProfile.organizationName?.trim() || null,
            organizationType: funderProfile.organizationType?.trim() || null,
            fundingInterests: funderProfile.fundingInterests?.trim() || null,
            focusDistricts: funderProfile.focusDistricts?.trim() || null,
            focusSectors: funderProfile.focusSectors?.trim() || null
          }
        } : undefined,
        trainingProviderProfile: hasRole(Role.TrainingProvider) ? {
          create: {
            institutionName: trainingProviderProfile.institutionName.trim(),
            trainingCategories: trainingProviderProfile.trainingCategories?.trim() || null,
            coursesOffered: trainingProviderProfile.coursesOffered?.trim() || null,
            accreditation: trainingProviderProfile.accreditation?.trim() || null,
            trainingLocation: trainingProviderProfile.trainingLocation?.trim() || null,
            contactPhone: trainingProviderProfile.contactPhone?.trim() || phone?.trim() || null,
            website: trainingProviderProfile.website?.trim() || null
          }
        } : undefined
      },
      include: {
        roles: true,
        district: true,
        jobSeekerProfile: true,
        employerProfile: true,
        entrepreneurProfile: true,
        funderProfile: true,
        trainingProviderProfile: true
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
        roles: newUser.roles.map((r) => r.role),
        permissions: permissionsForRoles(newUser.roles.map((r) => r.role)),
        jobSeekerProfile: newUser.jobSeekerProfile,
        employerProfile: newUser.employerProfile,
        entrepreneurProfile: newUser.entrepreneurProfile,
        funderProfile: newUser.funderProfile,
        trainingProviderProfile: newUser.trainingProviderProfile
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
      jobSeekerProfile: true,
      employerProfile: true,
      entrepreneurProfile: true,
      funderProfile: true,
      trainingProviderProfile: true,
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
        permissions: permissionsForRoles(user.roles.map((r) => r.role)),
        jobSeekerProfile: user.jobSeekerProfile,
        employerProfile: user.employerProfile,
        entrepreneurProfile: user.entrepreneurProfile,
        funderProfile: user.funderProfile,
        trainingProviderProfile: user.trainingProviderProfile,
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
        entrepreneurProfile: true,
        funderProfile: true,
        trainingProviderProfile: true,
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
        permissions: permissionsForRoles(user.roles.map((r) => r.role)),
        jobSeekerProfile: user.jobSeekerProfile,
        employerProfile: user.employerProfile,
        entrepreneurProfile: user.entrepreneurProfile,
        funderProfile: user.funderProfile,
        trainingProviderProfile: user.trainingProviderProfile,
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
