import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import verificationRoutes from "./routes/verification.routes";
import jobRoutes from "./routes/job.routes";
import pitchRoutes from "./routes/pitch.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import adminRoutes from "./routes/admin.routes";
import masterRoutes from "./routes/master.routes";
import funderRoutes from "./routes/funders.routes";
import { authenticateToken } from "./middleware/auth.middleware";
import { hasPermission } from "./config/permissions";

export const app = express();
const prisma = new PrismaClient();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [
      CLIENT_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads directory for verification documents
const uploadsPath = path.join(__dirname, "../uploads");
app.use(
  "/uploads",
  authenticateToken,
  async (req, res, next) => {
    try {
      const fileName = path.basename(req.path);
      const fileUrl = `/uploads/${fileName}`;
      const verification = await prisma.verificationRequest.findFirst({
        where: {
          OR: [
            { gramaNiladhariDocUrl: fileUrl },
            { businessRegDocUrl: fileUrl },
            { institutionDocUrl: fileUrl }
          ]
        },
        select: { userId: true }
      });

      if (!verification) {
        return res.status(404).json({ error: "File not found" });
      }

      const isVerifier = hasPermission(req.user!.roles, "verification:review");
      if (!isVerifier && verification.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions." });
      }

      return next();
    } catch (error) {
      console.error("Upload access check error:", error);
      return res.status(500).json({ error: "Failed to verify file access" });
    }
  },
  express.static(uploadsPath)
);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Jobs & Micro-Business Funding Platform (Sri Lanka) API",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Jobs & Micro-Business Funding Platform (Sri Lanka) API",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/pitches", pitchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/funders", funderRoutes);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "An unexpected internal server error occurred"
  });
});
