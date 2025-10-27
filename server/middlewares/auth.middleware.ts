import { Request, Response, NextFunction } from "express";
import { Permission } from "@shared/schema";
import { storage } from '../storage';

// Extend Express Request type to include session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        firstName: string;
        lastName?: string;
        role: string;
        permissions: Permission[];
        avatar?: string;
      };
    }
  }
}

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).session?.user;

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = user;
  next();
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Permission-based authorization middleware
// export const requirePermission = (...permissions: Permission[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const user = req.user;

//     if (!user) {
//       return res.status(401).json({ error: "Authentication required" });
//     }

//     // Admins have all permissions
//     if (user.role === "admin") {
//       return next();
//     }

//     const hasPermission = permissions.some(permission => 
//       user.permissions.includes(permission)
//     );

//     if (!hasPermission) {
//       return res.status(403).json({ error: "Insufficient permissions" });
//     }

//     next();
//   };
// };


export const requirePermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const getUserPermissions = await storage.getPermissions(user.id);

      // console.log(`User permissions from storage: ${JSON.stringify(getUserPermissions)}`);

      const userPermissions = (getUserPermissions ?? []).reduce(
        (acc, perm) => {
          acc[perm] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );      
      
      
      const hasPermission = permissions.some(
        (perm) => userPermissions[perm]
      )

      // console.log(
      //   `User permissions: ${JSON.stringify(userPermissions)}, ` +
      //   `Required permissions: ${permissions}, Has permission: ${hasPermission}`
      // );

      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};






// Optional auth middleware (doesn't require auth but adds user if available)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).session?.user;
  if (user) {
    req.user = user;
  }
  next();
};