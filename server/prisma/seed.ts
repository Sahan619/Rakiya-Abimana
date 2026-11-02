import { PrismaClient, Role, VerificationStatus, PitchStatus, JobStatus, ApplicationStatus, FundingType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SRI_LANKA_DISTRICTS } from "../src/constants/districts";
import { DEFAULT_JOB_CATEGORIES, DEFAULT_SECTORS, DEFAULT_SYSTEM_SETTINGS } from "../src/constants/masterData";
import { encryptData } from "../src/services/crypto.service";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process for Sri Lanka Jobs & Micro-Business Funding Platform...");

  // 1. Seed 25 Districts
  console.log("Seeding 25 Sri Lanka districts...");
  for (const d of SRI_LANKA_DISTRICTS) {
    await prisma.district.upsert({
      where: { id: d.id },
      update: { nameEn: d.nameEn, nameSi: d.nameSi, nameTa: d.nameTa, province: d.province, lat: d.lat, lng: d.lng },
      create: { id: d.id, nameEn: d.nameEn, nameSi: d.nameSi, nameTa: d.nameTa, province: d.province, lat: d.lat, lng: d.lng }
    });
  }

  // 2. Seed Job Categories and Trades
  console.log("Seeding job categories and trades...");
  for (const cat of DEFAULT_JOB_CATEGORIES) {
    await prisma.jobCategory.upsert({
      where: { id: cat.id },
      update: { nameEn: cat.nameEn, nameSi: cat.nameSi, nameTa: cat.nameTa },
      create: { id: cat.id, nameEn: cat.nameEn, nameSi: cat.nameSi, nameTa: cat.nameTa }
    });

    for (const trade of cat.trades) {
      await prisma.trade.upsert({
        where: { id: trade.id },
        update: { nameEn: trade.nameEn, nameSi: trade.nameSi, nameTa: trade.nameTa, categoryId: cat.id },
        create: { id: trade.id, nameEn: trade.nameEn, nameSi: trade.nameSi, nameTa: trade.nameTa, categoryId: cat.id }
      });
    }
  }

  // 3. Seed Sectors
  console.log("Seeding micro-business sectors...");
  for (const s of DEFAULT_SECTORS) {
    await prisma.sector.upsert({
      where: { id: s.id },
      update: { nameEn: s.nameEn, nameSi: s.nameSi, nameTa: s.nameTa },
      create: { id: s.id, nameEn: s.nameEn, nameSi: s.nameSi, nameTa: s.nameTa }
    });
  }

  // 4. Seed System Settings
  console.log("Seeding system settings...");
  for (const setting of DEFAULT_SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description }
    });
  }

  // 5. Seed Demo Users
  console.log("Seeding demo users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@rakiya.lk" },
    update: {},
    create: {
      email: "admin@rakiya.lk",
      passwordHash,
      fullName: "Nimal Perera (Admin)",
      dateOfBirth: new Date("1980-05-15"),
      phone: "+94771234560",
      districtId: "colombo",
      lat: 6.9271,
      lng: 79.8612,
      preferredLanguage: "en",
      isVerified: true,
      roles: { create: [{ role: Role.Admin }] }
    }
  });

  // Verifier
  const verifier = await prisma.user.upsert({
    where: { email: "verifier@rakiya.lk" },
    update: {},
    create: {
      email: "verifier@rakiya.lk",
      passwordHash,
      fullName: "Sita Rajapakse (Verifier)",
      dateOfBirth: new Date("1985-08-20"),
      phone: "+94771234561",
      districtId: "colombo",
      lat: 6.9271,
      lng: 79.8612,
      preferredLanguage: "si",
      isVerified: true,
      roles: { create: [{ role: Role.Verifier }] }
    }
  });

  // JobSeeker 1 - Kamal (Colombo)
  const kamalDob = new Date("1992-03-24"); // day 84 in 1992
  const kamal = await prisma.user.upsert({
    where: { email: "kamal.seeker@rakiya.lk" },
    update: {},
    create: {
      email: "kamal.seeker@rakiya.lk",
      passwordHash,
      fullName: "Kamal Wickramasinghe",
      dateOfBirth: kamalDob,
      phone: "+94712345678",
      districtId: "colombo",
      lat: 6.9271,
      lng: 79.8612,
      preferredLanguage: "si",
      isVerified: true,
      roles: { create: [{ role: Role.JobSeeker }] },
      jobSeekerProfile: {
        create: {
          category: "skilled tradesperson",
          trade: "Licensed Electrician",
          skills: "Domestic wiring, 3-phase industrial power, circuit breaker repair, solar installation",
          experienceYears: 6,
          bio: "Certified NVQ-4 Electrician looking for residential and commercial electrical work around Western Province."
        }
      }
    }
  });

  // Kamal's verification record
  await prisma.verificationRequest.upsert({
    where: { userId: kamal.id },
    update: {},
    create: {
      userId: kamal.id,
      encryptedNic: encryptData("920841234V"),
      nicFormat: "OLD",
      dobMatch: true,
      status: VerificationStatus.APPROVED,
      reviewerId: verifier.id,
      reviewedAt: new Date()
    }
  });

  // JobSeeker 2 - Priya (Jaffna)
  const priya = await prisma.user.upsert({
    where: { email: "priya.seeker@rakiya.lk" },
    update: {},
    create: {
      email: "priya.seeker@rakiya.lk",
      passwordHash,
      fullName: "Priyadarshini Selladurai",
      dateOfBirth: new Date("1996-10-12"),
      phone: "+94762345679",
      districtId: "jaffna",
      lat: 9.6615,
      lng: 80.0255,
      preferredLanguage: "ta",
      isVerified: true,
      roles: { create: [{ role: Role.JobSeeker }] },
      jobSeekerProfile: {
        create: {
          category: "white-collar",
          trade: "Accounts Clerk & Bookkeeper",
          skills: "QuickBooks, MS Excel, Tally, payroll preparation, bilingual Tamil-English",
          experienceYears: 4,
          bio: "AAT qualified accountant clerk looking for part-time or full-time accounting roles in Jaffna district."
        }
      }
    }
  });

  // Employer - Sunil (Gampaha, Verified)
  const sunil = await prisma.user.upsert({
    where: { email: "sunil.employer@rakiya.lk" },
    update: {},
    create: {
      email: "sunil.employer@rakiya.lk",
      passwordHash,
      fullName: "Sunil Jayasuriya",
      dateOfBirth: new Date("1978-04-18"),
      phone: "+94773456780",
      districtId: "gampaha",
      lat: 7.084,
      lng: 79.9943,
      preferredLanguage: "en",
      isVerified: true,
      roles: { create: [{ role: Role.Employer }] },
      employerProfile: {
        create: {
          companyName: "Lanka Eco Furniture Works",
          businessRegNumber: "PV-129481/GMP",
          description: "Sustainable teak and mahogany custom furniture manufacturing and construction joinery based in Gampaha.",
          website: "https://lankaecofurniture.example.lk"
        }
      }
    }
  });

  await prisma.verificationRequest.upsert({
    where: { userId: sunil.id },
    update: {},
    create: {
      userId: sunil.id,
      encryptedNic: encryptData("781081234V"),
      nicFormat: "OLD",
      dobMatch: true,
      status: VerificationStatus.APPROVED,
      reviewerId: verifier.id,
      reviewedAt: new Date()
    }
  });

  // Entrepreneur 1 - Anura (Kandy, Verified with approved pitch)
  const anura = await prisma.user.upsert({
    where: { email: "anura.entrepreneur@rakiya.lk" },
    update: {},
    create: {
      email: "anura.entrepreneur@rakiya.lk",
      passwordHash,
      fullName: "Anura Bandara",
      dateOfBirth: new Date("1989-11-05"),
      phone: "+94774567891",
      districtId: "kandy",
      lat: 7.2906,
      lng: 80.6337,
      preferredLanguage: "si",
      isVerified: true,
      roles: { create: [{ role: Role.Entrepreneur }] }
    }
  });

  await prisma.verificationRequest.upsert({
    where: { userId: anura.id },
    update: {},
    create: {
      userId: anura.id,
      encryptedNic: encryptData("893101234V"),
      nicFormat: "OLD",
      dobMatch: true,
      status: VerificationStatus.APPROVED,
      reviewerId: verifier.id,
      reviewedAt: new Date()
    }
  });

  // Entrepreneur 2 - Fatima (Galle, Pending Verification)
  const fatima = await prisma.user.upsert({
    where: { email: "fatima.entrepreneur@rakiya.lk" },
    update: {},
    create: {
      email: "fatima.entrepreneur@rakiya.lk",
      passwordHash,
      fullName: "Fatima Noor",
      dateOfBirth: new Date("1994-07-22"),
      phone: "+94775678902",
      districtId: "galle",
      lat: 6.0535,
      lng: 80.221,
      preferredLanguage: "ta",
      isVerified: false,
      roles: { create: [{ role: Role.Entrepreneur }] }
    }
  });

  await prisma.verificationRequest.upsert({
    where: { userId: fatima.id },
    update: {},
    create: {
      userId: fatima.id,
      encryptedNic: encryptData("947041234V"),
      nicFormat: "OLD",
      dobMatch: true,
      status: VerificationStatus.PENDING
    }
  });

  // Funder - Lanka Funder (CSR Business)
  const funder = await prisma.user.upsert({
    where: { email: "lanka.funder@rakiya.lk" },
    update: {},
    create: {
      email: "lanka.funder@rakiya.lk",
      passwordHash,
      fullName: "Dilshan Samarasekera",
      dateOfBirth: new Date("1975-02-10"),
      phone: "+94776789013",
      districtId: "colombo",
      lat: 6.9271,
      lng: 79.8612,
      preferredLanguage: "en",
      isVerified: true,
      roles: { create: [{ role: Role.Funder }] },
      funderProfile: {
        create: {
          funderType: "CSR business",
          focusDistricts: "kandy, galle, jaffna, kurunegala",
          focusSectors: "agriculture-agro, handicrafts-cottage, food-beverage"
        }
      }
    }
  });

  // Training Provider
  await prisma.user.upsert({
    where: { email: "vocational.training@rakiya.lk" },
    update: {},
    create: {
      email: "vocational.training@rakiya.lk",
      passwordHash,
      fullName: "Sri Lanka Vocational Training Institute",
      dateOfBirth: new Date("1980-01-01"),
      phone: "+94112345670",
      districtId: "colombo",
      lat: 6.9271,
      lng: 79.8612,
      preferredLanguage: "en",
      isVerified: true,
      roles: { create: [{ role: Role.TrainingProvider }] }
    }
  });

  // 6. Seed Sample Jobs (by Sunil)
  console.log("Seeding sample jobs...");
  const job1 = await prisma.job.create({
    data: {
      employerId: sunil.id,
      title: "Master Wood Carpenter & Joiner Needed",
      category: "skilled-trades",
      districtId: "gampaha",
      lat: 7.084,
      lng: 79.9943,
      wage: 85000,
      wageType: "MONTHLY",
      description: "Seeking an experienced carpenter for precision cutting, assembling custom dining tables, and cabinetry. Must have minimum 3 years hands-on woodwork experience.",
      sourceLanguage: "en",
      status: JobStatus.OPEN
    }
  });

  const job2 = await prisma.job.create({
    data: {
      employerId: sunil.id,
      title: "Site Maintenance Electrician",
      category: "skilled-trades",
      districtId: "colombo",
      lat: 6.9271,
      lng: 79.8612,
      wage: 3500,
      wageType: "DAILY",
      description: "Immediate requirement for daily electrical maintenance and wiring overhaul at our Colombo warehouse facility. Transport allowance provided.",
      sourceLanguage: "en",
      status: JobStatus.OPEN
    }
  });

  const job3 = await prisma.job.create({
    data: {
      employerId: sunil.id,
      title: "Factory Assembly & Packing Crew",
      category: "blue-collar",
      districtId: "gampaha",
      lat: 7.084,
      lng: 79.9943,
      wage: 55000,
      wageType: "MONTHLY",
      description: "Clean factory packing environment, inspecting goods before dispatch, loading safely. Meals provided during duty hours.",
      sourceLanguage: "en",
      status: JobStatus.OPEN
    }
  });

  // 7. Seed Sample Pitches (by Anura)
  console.log("Seeding sample micro-business pitches...");
  const pitch1 = await prisma.pitch.create({
    data: {
      entrepreneurId: anura.id,
      title: "Kandy Organic Bee-keeping & Pure Hill-Country Honey Expansion",
      story: "We run a small family-owned apiary producing pure raw mountain honey in Kandy. We currently maintain 25 beehives and wish to expand to 75 hives to meet local organic grocery demand. Funding will purchase modern wooden hive boxes, protective gear for 3 local village workers, and glass bottling equipment.",
      districtId: "kandy",
      sectorId: "agriculture-agro",
      fundingNeeded: 450000,
      fundingType: FundingType.MICRO_LOAN,
      status: PitchStatus.APPROVED,
      sourceLanguage: "en"
    }
  });

  // 8. Seed Job Application (Kamal applies for Job 2)
  console.log("Seeding job applications...");
  await prisma.jobApplication.create({
    data: {
      jobId: job2.id,
      applicantId: kamal.id,
      status: ApplicationStatus.SHORTLISTED,
      notes: "I have 6 years experience in industrial electrical maintenance and live 15 mins away from Colombo warehouse."
    }
  });

  // 9. Seed Pitch Interest / Pledge (Funder pledges interest on Anura's pitch)
  console.log("Seeding pitch interest and pledges...");
  await prisma.pitchInterest.create({
    data: {
      pitchId: pitch1.id,
      funderId: funder.id,
      pledgeAmount: 200000,
      message: "We love your sustainable community beekeeping initiative. Our CSR fund would like to support 200,000 LKR towards the hive boxes and provide free sustainable packaging advisory."
    }
  });

  // 10. Seed Conversation & Messages
  console.log("Seeding conversations...");
  const conv = await prisma.conversation.create({
    data: {
      type: "JOB_APPLICATION",
      referenceId: job2.id,
      participant1Id: sunil.id,
      participant2Id: kamal.id
    }
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: sunil.id,
      receiverId: kamal.id,
      content: "Hello Kamal, I saw your electrical experience and application. Can you visit the site this Thursday for a brief walkthrough?",
      originalLanguage: "en"
    }
  });

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: kamal.id,
      receiverId: sunil.id,
      content: "ස්තූතියි මහත්මයා. මම බ්‍රහස්පතින්දා උදෑසන 10ට පැමිණෙන්නම්. (Thank you sir, I can visit on Thursday at 10 AM.)",
      originalLanguage: "si"
    }
  });

  // 11. Seed Audit Logs
  console.log("Seeding audit logs...");
  await prisma.auditLog.create({
    data: {
      action: "VERIFICATION_APPROVED",
      actorId: verifier.id,
      targetType: "VerificationRequest",
      targetId: kamal.id,
      details: JSON.stringify({ applicant: "Kamal Wickramasinghe", nicFormat: "OLD", dobMatch: true })
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "PITCH_APPROVED",
      actorId: verifier.id,
      targetType: "Pitch",
      targetId: pitch1.id,
      details: JSON.stringify({ title: pitch1.title, fundingNeeded: 450000 })
    }
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

