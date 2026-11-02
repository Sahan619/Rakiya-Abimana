import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

/**
 * Middleware to require at least one of the specified roles
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        error: "Access denied. Insufficient role permissions.",
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * Middleware to require identity/business verification
 */
export function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      error: "Verification required. Please complete identity and business verification to perform this action.",
      isVerified: false
    });
  }

  next();
}

