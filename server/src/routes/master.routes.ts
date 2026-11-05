import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";

const router = Router();
const prisma = new PrismaClient();

// GET /api/master/districts - Publicly accessible
router.get("/districts", async (_req: Request, res: Response) => {
  try {
    const districts = await prisma.district.findMany({
      orderBy: { nameEn: "asc" }
    });
    return res.json({ districts });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch districts" });
  }
});

// GET /api/master/categories - Publicly accessible
router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.jobCategory.findMany({
      include: { trades: true },
      orderBy: { nameEn: "asc" }
    });
    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch job categories" });
  }
});

// GET /api/master/sectors - Publicly accessible
router.get("/sectors", async (_req: Request, res: Response) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { nameEn: "asc" }
    });
    return res.json({ sectors });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch sectors" });
  }
});

// POST /api/master/categories - Admin creates category
router.post(
  "/categories",
  authenticateToken,
  requirePermission("masterdata:manage"),
  async (req: Request, res: Response) => {
    try {
      const { id, nameEn, nameSi, nameTa } = req.body;
      if (!id || !nameEn || !nameSi || !nameTa) {
        return res.status(400).json({ error: "id, nameEn, nameSi, and nameTa are required" });
      }

      const cat = await prisma.jobCategory.create({
        data: { id, nameEn, nameSi, nameTa }
      });
      return res.status(201).json({ category: cat });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create category" });
    }
  }
);

// POST /api/master/sectors - Admin creates sector
router.post(
  "/sectors",
  authenticateToken,
  requirePermission("masterdata:manage"),
  async (req: Request, res: Response) => {
    try {
      const { id, nameEn, nameSi, nameTa } = req.body;
      if (!id || !nameEn || !nameSi || !nameTa) {
        return res.status(400).json({ error: "id, nameEn, nameSi, and nameTa are required" });
      }

      const sector = await prisma.sector.create({
        data: { id, nameEn, nameSi, nameTa }
      });
      return res.status(201).json({ sector });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create sector" });
    }
  }
);

export default router;
