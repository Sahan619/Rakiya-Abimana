import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false }
    });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { isRead: true }
    });
    return res.json({ message: "Notification marked as read" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update notification" });
  }
});

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", authenticateToken, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

export default router;

