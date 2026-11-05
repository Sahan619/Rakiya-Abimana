-- Reviewed migration for role-specific registration/profile data.
-- This migration is intentionally not executed automatically by the application.

ALTER TABLE "JobSeekerProfile"
  ADD COLUMN "educationQualifications" TEXT,
  ADD COLUMN "preferredCategories" TEXT,
  ADD COLUMN "preferredLocations" TEXT,
  ADD COLUMN "expectedSalary" DOUBLE PRECISION;

ALTER TABLE "EmployerProfile"
  ADD COLUMN "industry" TEXT,
  ADD COLUMN "businessAddress" TEXT,
  ADD COLUMN "contactPhone" TEXT;

ALTER TABLE "FunderProfile"
  ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'ORGANIZATION',
  ADD COLUMN "organizationName" TEXT,
  ADD COLUMN "organizationType" TEXT,
  ADD COLUMN "fundingInterests" TEXT;

CREATE TABLE "EntrepreneurProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT,
  "businessCategory" TEXT,
  "businessIdea" TEXT,
  "businessStage" TEXT,
  "fundingRequirement" DOUBLE PRECISION,
  "skillsExperience" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EntrepreneurProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EntrepreneurProfile_userId_key" ON "EntrepreneurProfile"("userId");
ALTER TABLE "EntrepreneurProfile" ADD CONSTRAINT "EntrepreneurProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TrainingProviderProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "institutionName" TEXT NOT NULL,
  "trainingCategories" TEXT,
  "coursesOffered" TEXT,
  "accreditation" TEXT,
  "trainingLocation" TEXT,
  "contactPhone" TEXT,
  "website" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingProviderProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrainingProviderProfile_userId_key" ON "TrainingProviderProfile"("userId");
ALTER TABLE "TrainingProviderProfile" ADD CONSTRAINT "TrainingProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VerificationRequest"
  ALTER COLUMN "encryptedNic" DROP NOT NULL,
  ALTER COLUMN "nicFormat" DROP NOT NULL,
  ALTER COLUMN "dobMatch" DROP NOT NULL,
  ADD COLUMN "institutionDocUrl" TEXT;
