import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rakiya_abimana_jwt_super_secret_key_2026_lk";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  isVerified: boolean;
  preferredLanguage: string;
  districtId?: string | null;
  lat?: number | null;
  lng?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { roles: true }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact an administrator." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map((r) => r.role),
      isVerified: user.isVerified,
      preferredLanguage: user.preferredLanguage,
      districtId: user.districtId,
      lat: user.lat,
      lng: user.lng
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { roles: true }
    }).then((user) => {
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles.map((r) => r.role),
          isVerified: user.isVerified,
          preferredLanguage: user.preferredLanguage,
          districtId: user.districtId,
          lat: user.lat,
          lng: user.lng
        };
      }
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

