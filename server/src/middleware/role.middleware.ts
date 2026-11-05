import { Request, Response, NextFunction } from "express";
import { Permission, PERMISSIONS, hasPermission } from "../config/permissions";

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const grantedPermissions = permissions.filter((permission) =>
      hasPermission(req.user!.roles, permission)
    );
    if (grantedPermissions.length === 0) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    const permitted = grantedPermissions.some((permission) =>
      !PERMISSIONS[permission].requiresVerified || req.user!.isVerified
    );
    if (!permitted) {
      return res.status(403).json({
        error: "Verification required. Please complete identity and business verification to perform this action."
      });
    }

    return next();
  };
}
