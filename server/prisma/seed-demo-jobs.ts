import { PrismaClient, JobStatus, Role } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { SRI_LANKA_DISTRICTS } from "../src/constants/districts";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const prisma = new PrismaClient();
const LEGACY_DEMO_PREFIX = "[DEMO SPRINT 01]";
const DEMO_EMPLOYER_EMAIL = "sunil.employer@rakiya.lk";

type DemoJob = {
  title: string;
  category: string;
  districtId: string;
  wage: number;
  wageType: "MONTHLY" | "DAILY" | "HOURLY" | "PIECE_RATE";
  description: string;
};

const demoJobs: DemoJob[] = [
  { title: "Electrical Technician", category: "skilled-trades-technical-services", districtId: "colombo", wage: 65000, wageType: "MONTHLY", description: "Install, test, and repair electrical wiring, lighting, and distribution boards at small commercial sites. Required skills: NVQ electrical training, safe tool handling, fault finding, and the ability to read basic wiring diagrams." },
  { title: "Plumbing Technician", category: "skilled-trades-technical-services", districtId: "gampaha", wage: 3200, wageType: "DAILY", description: "Handle plumbing repairs, water-line installation, bathroom fittings, and leak checks for residential customers. Required skills: practical plumbing experience, careful measurement, safe use of hand tools, and good customer communication." },
  { title: "Mason", category: "construction-infrastructure", districtId: "kandy", wage: 3800, wageType: "DAILY", description: "Build and repair brick walls, concrete blocks, plasterwork, and floor finishes on housing projects. Required skills: masonry experience, accurate levelling, safe site practices, and the ability to follow a supervisor's measurements." },
  { title: "Construction Site Supervisor", category: "construction-infrastructure", districtId: "galle", wage: 90000, wageType: "MONTHLY", description: "Coordinate daily work teams, materials, safety checks, and progress reporting for a small building project. Required skills: construction site experience, team coordination, basic quantity checking, and clear written reporting." },
  { title: "Production Line Operator", category: "manufacturing-production", districtId: "kurunegala", wage: 58000, wageType: "MONTHLY", description: "Operate and monitor a food-packaging production line, complete hourly checks, and keep the work area clean. Required skills: punctuality, attention to quality, basic machine operation, and willingness to work rotating shifts." },
  { title: "Quality Control Assistant", category: "manufacturing-production", districtId: "colombo", wage: 62000, wageType: "MONTHLY", description: "Inspect finished goods, record measurements, identify damaged items, and support daily quality reports. Required skills: careful observation, basic arithmetic, accurate record keeping, and a willingness to learn factory procedures." },
  { title: "Farm Supervisor", category: "agriculture-farming", districtId: "anuradhapura", wage: 70000, wageType: "MONTHLY", description: "Plan field work, guide seasonal workers, monitor irrigation, and maintain simple crop and harvest records on a vegetable farm. Required skills: practical farming knowledge, team leadership, crop-care awareness, and reliable outdoor work habits." },
  { title: "Agricultural Field Assistant", category: "agriculture-farming", districtId: "badulla", wage: 2800, wageType: "DAILY", description: "Support planting, weeding, harvesting, packing, and basic greenhouse maintenance on a hill-country farm. Required skills: physical fitness, care with farm tools, teamwork, and willingness to work early morning shifts." },
  { title: "Junior Web Developer", category: "information-technology-digital-services", districtId: "colombo", wage: 85000, wageType: "MONTHLY", description: "Assist with maintaining small business websites, updating pages, testing forms, and fixing straightforward front-end issues. Required skills: basic HTML, CSS, JavaScript, Git, problem solving, and a willingness to learn from a senior developer." },
  { title: "IT Support Technician", category: "information-technology-digital-services", districtId: "gampaha", wage: 72000, wageType: "MONTHLY", description: "Provide first-line support for computers, printers, user accounts, and office network issues at a growing local business. Required skills: Windows troubleshooting, basic networking, hardware setup, patient communication, and ticket documentation." },
  { title: "Administrative Assistant", category: "administration-office-support", districtId: "matara", wage: 55000, wageType: "MONTHLY", description: "Support reception, filing, appointment coordination, invoice preparation, and routine office correspondence. Required skills: organised working habits, basic MS Office or Google Workspace knowledge, accuracy, and professional communication." },
  { title: "Data Entry Operator", category: "administration-office-support", districtId: "jaffna", wage: 2400, wageType: "DAILY", description: "Enter stock and customer information into spreadsheets and verify source documents before submission. Required skills: accurate typing, spreadsheet basics, attention to detail, and the ability to handle routine work consistently." },
  { title: "Sales Executive", category: "sales-marketing-retail", districtId: "colombo", wage: 60000, wageType: "MONTHLY", description: "Visit small business customers, explain product options, follow up on enquiries, and maintain a simple sales pipeline. Required skills: confident communication, basic product presentation, customer follow-up, and a valid driving licence is useful." },
  { title: "Retail Sales Assistant", category: "sales-marketing-retail", districtId: "kandy", wage: 2500, wageType: "DAILY", description: "Welcome customers, arrange displays, explain household products, process sales, and help maintain accurate shelf stock. Required skills: friendly service, basic numeracy, neat presentation, and willingness to work weekends when scheduled." },
  { title: "Hotel Receptionist", category: "hospitality-tourism", districtId: "galle", wage: 65000, wageType: "MONTHLY", description: "Handle guest check-in and check-out, answer enquiries, coordinate room requests, and keep reception records updated at a small coastal hotel. Required skills: polite English communication, computer basics, customer service, and calm problem solving." },
  { title: "Commis Chef", category: "hospitality-tourism", districtId: "matara", wage: 3000, wageType: "DAILY", description: "Prepare ingredients, support the kitchen team during service, follow recipes, and maintain food hygiene standards. Required skills: basic cookery training, safe knife handling, cleanliness, teamwork, and the ability to work early or late shifts." },
  { title: "Delivery Driver", category: "transportation-logistics", districtId: "kurunegala", wage: 65000, wageType: "MONTHLY", description: "Deliver packaged goods to customers and partner shops, confirm quantities, collect delivery records, and care for the assigned motor vehicle. Required skills: valid driving licence, route knowledge, safe driving, punctuality, and respectful customer service." },
  { title: "Warehouse Assistant", category: "transportation-logistics", districtId: "gampaha", wage: 2600, wageType: "DAILY", description: "Receive goods, label cartons, pick orders, load deliveries safely, and keep warehouse stock locations organised. Required skills: physical fitness, careful counting, safe lifting, teamwork, and basic stock-record familiarity." },
  { title: "Elderly Care Assistant", category: "healthcare-caregiving", districtId: "badulla", wage: 55000, wageType: "MONTHLY", description: "Support an elderly day-care programme with meals, mobility assistance, activity supervision, and respectful daily companionship. Required skills: patience, basic first-aid awareness, dependable attendance, empathy, and the ability to follow care instructions." },
  { title: "Healthcare Support Assistant", category: "healthcare-caregiving", districtId: "colombo", wage: 2800, wageType: "DAILY", description: "Assist clinic staff with patient reception, room preparation, supplies, cleaning routines, and non-clinical patient support. Required skills: respectful communication, hygiene awareness, careful record handling, and willingness to learn clinic procedures." },
  { title: "Preschool Assistant", category: "education-training", districtId: "matara", wage: 50000, wageType: "MONTHLY", description: "Help the teacher prepare play-based activities, supervise children, organise learning materials, and communicate routine updates to parents. Required skills: patience, creativity, child-safety awareness, teamwork, and a caring attitude." },
  { title: "Vocational Training Instructor", category: "education-training", districtId: "kandy", wage: 85000, wageType: "MONTHLY", description: "Deliver practical introductory lessons in workplace safety and basic technical skills for young adult learners. Required skills: relevant trade experience, clear demonstrations, lesson planning, learner encouragement, and a recognised vocational qualification is preferred." },
  { title: "Professional Beautician", category: "beauty-fashion-personal-services", districtId: "galle", wage: 60000, wageType: "MONTHLY", description: "Provide professional hair, skincare, manicure, and basic beauty services while maintaining a clean and welcoming salon station. Required skills: beauty-service training, hygiene practice, customer care, and careful use of salon equipment." },
  { title: "Tailoring Assistant", category: "beauty-fashion-personal-services", districtId: "jaffna", wage: 2200, wageType: "DAILY", description: "Assist with measuring, fabric preparation, machine sewing, pressing, alterations, and organising customer orders in a tailoring studio. Required skills: basic sewing, accurate measuring, fabric care, patience, and willingness to learn finishing techniques." },
  { title: "Facility Maintenance Assistant", category: "cleaning-maintenance-facility-services", districtId: "ratnapura", wage: 58000, wageType: "MONTHLY", description: "Support routine building checks, minor repairs, light painting, changing fittings, and coordination of outside service providers. Required skills: practical maintenance ability, safe tool use, basic electrical awareness, reliability, and good housekeeping." },
  { title: "Commercial Cleaning Supervisor", category: "cleaning-maintenance-facility-services", districtId: "colombo", wage: 65000, wageType: "MONTHLY", description: "Lead a small cleaning team, allocate daily areas, check service quality, manage supplies, and report maintenance concerns to the client. Required skills: cleaning experience, team supervision, checklist discipline, safe chemical handling, and polite communication." },
  { title: "Accounts Assistant", category: "finance-accounting-business-services", districtId: "kurunegala", wage: 65000, wageType: "MONTHLY", description: "Support invoice entry, payment tracking, bank-reconciliation preparation, filing, and monthly accounting schedules for a small business. Required skills: basic bookkeeping, spreadsheet confidence, numeracy, accuracy, and AAT or equivalent study is preferred." },
  { title: "Junior Bookkeeper", category: "finance-accounting-business-services", districtId: "jaffna", wage: 70000, wageType: "MONTHLY", description: "Maintain daily transaction records, organise receipts, prepare simple ledgers, and assist with monthly reports under the guidance of a senior accounts officer. Required skills: bookkeeping fundamentals, accounting software familiarity, confidentiality, and careful document management." },
  { title: "General Helper", category: "general-labor-other-services", districtId: "ratnapura", wage: 2300, wageType: "DAILY", description: "Assist the operations team with moving materials, preparing work areas, basic sorting, loading, and general support tasks as assigned. Required skills: physical fitness, punctuality, safe lifting, willingness to learn, and dependable teamwork." },
  { title: "Packing and Loading Assistant", category: "general-labor-other-services", districtId: "anuradhapura", wage: 52000, wageType: "MONTHLY", description: "Pack household goods, check labels, prepare dispatch bundles, and load items carefully for local deliveries. Required skills: attention to packing quality, safe lifting, basic counting, teamwork, and the ability to follow dispatch instructions." }
];

function districtCoordinates(districtId: string) {
  const district = SRI_LANKA_DISTRICTS.find((item) => item.id === districtId);
  if (!district) throw new Error(`Unknown district in demo job data: ${districtId}`);
  return { lat: district.lat, lng: district.lng };
}

async function main() {
  const categories = await prisma.jobCategory.findMany({ select: { id: true } });
  const categoryIds = new Set(categories.map((category) => category.id));
  const missingCategories = [...new Set(demoJobs.map((job) => job.category))].filter((id) => !categoryIds.has(id));
  if (missingCategories.length > 0) {
    throw new Error(`Missing job categories: ${missingCategories.join(", ")}. Run the category migration first.`);
  }

  const employer = await prisma.user.findFirst({
    where: {
      email: DEMO_EMPLOYER_EMAIL,
      isVerified: true,
      roles: { some: { role: Role.Employer } }
    }
  });
  if (!employer) {
    throw new Error("Verified fictional demo employer sunil.employer@rakiya.lk was not found.");
  }

  let created = 0;
  let updated = 0;
  for (const demoJob of demoJobs) {
    const title = demoJob.title;
    const coordinates = districtCoordinates(demoJob.districtId);
    const data = {
      employerId: employer.id,
      title,
      category: demoJob.category,
      districtId: demoJob.districtId,
      ...coordinates,
      wage: demoJob.wage,
      wageType: demoJob.wageType,
      description: demoJob.description,
      sourceLanguage: "en",
      status: JobStatus.OPEN
    };

    const existing = await prisma.job.findFirst({
      where: {
        employerId: employer.id,
        description: demoJob.description,
        OR: [
          { title: demoJob.title },
          { title: `${LEGACY_DEMO_PREFIX} ${demoJob.title}` }
        ]
      }
    });
    if (existing) {
      await prisma.job.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.job.create({ data });
      created += 1;
    }
  }

  const demoCount = await prisma.job.count({
    where: {
      employerId: employer.id,
      OR: demoJobs.map((job) => ({ title: job.title, description: job.description }))
    }
  });
  const categoryCounts = await prisma.job.groupBy({
    by: ["category"],
    where: {
      employerId: employer.id,
      OR: demoJobs.map((job) => ({ title: job.title, description: job.description }))
    },
    _count: { _all: true }
  });

  console.log(`Demo job seed complete: ${created} created, ${updated} refreshed, ${demoCount} total demo jobs.`);
  console.log(JSON.stringify(categoryCounts, null, 2));
}

main()
  .catch((error) => {
    console.error("Demo job seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
