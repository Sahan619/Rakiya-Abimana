import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";
import { filterFunderDirectory, FunderDirectoryRecord } from "../services/funder-directory.service";

const router = Router();
const prisma = new PrismaClient();
const funderDirectorySelect = {
  id: true,
  fullName: true,
  isActive: true,
  isVerified: true,
  roles: {
    where: { role: Role.Funder },
    select: { role: true }
  },
  funderProfile: {
    select: {
      listedInDirectory: true,
      funderType: true,
      organizationName: true,
      focusDistricts: true,
      focusSectors: true,
      fundingInterests: true
    }
  }
} as const;

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

router.get("/", authenticateToken, requirePermission("funder:browse"), async (req: Request, res: Response) => {
  try {
    const page = positiveInteger(req.query.page, 1);
    const pageSize = Math.min(positiveInteger(req.query.pageSize, 12), 50);
    const records = await prisma.user.findMany({
      where: {
        isActive: true,
        isVerified: true,
        roles: { some: { role: Role.Funder } },
        funderProfile: { is: { listedInDirectory: true } }
      },
      select: funderDirectorySelect,
      orderBy: { fullName: "asc" }
    });
    const funders = filterFunderDirectory(
      records as FunderDirectoryRecord[],
      {
        district: typeof req.query.district === "string" ? req.query.district : undefined,
        sector: typeof req.query.sector === "string" ? req.query.sector : undefined,
        funderType: typeof req.query.funderType === "string" ? req.query.funderType : undefined
      }
    );
    const start = (page - 1) * pageSize;
    return res.json({
      funders: funders.slice(start, start + pageSize),
      page,
      pageSize,
      total: funders.length,
      totalPages: Math.ceil(funders.length / pageSize)
    });
  } catch (error) {
    console.error("Fetch funder directory error:", error);
    return res.status(500).json({ error: "Failed to fetch funder directory" });
  }
});

router.get("/:id", authenticateToken, requirePermission("funder:browse"), async (req: Request, res: Response) => {
  try {
    const record = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
        isVerified: true,
        roles: { some: { role: Role.Funder } },
        funderProfile: { is: { listedInDirectory: true } }
      },
      select: funderDirectorySelect
    });

    if (!record) {
      return res.status(404).json({ error: "Funder not found" });
    }

    const [funder] = filterFunderDirectory([record as FunderDirectoryRecord], {});
    if (!funder) {
      return res.status(404).json({ error: "Funder not found" });
    }
    return res.json({ funder });
  } catch (error) {
    console.error("Fetch funder profile error:", error);
    return res.status(500).json({ error: "Failed to fetch funder profile" });
  }
});

router.put(
  "/me/listing",
  authenticateToken,
  requirePermission("funder:manage_listing"),
  async (req: Request, res: Response) => {
    try {
      if (typeof req.body?.listedInDirectory !== "boolean") {
        return res.status(400).json({ error: "listedInDirectory must be a boolean." });
      }

      const result = await prisma.funderProfile.updateMany({
        where: { userId: req.user!.id },
        data: { listedInDirectory: req.body.listedInDirectory }
      });

      if (result.count === 0) {
        return res.status(404).json({ error: "Funder profile not found" });
      }

      return res.json({ listedInDirectory: req.body.listedInDirectory });
    } catch (error) {
      console.error("Update funder directory listing error:", error);
      return res.status(500).json({ error: "Failed to update funder directory listing" });
    }
  }
);

export default router;
