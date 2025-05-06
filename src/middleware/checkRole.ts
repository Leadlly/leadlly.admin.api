import { NextFunction, Request, Response } from "express";
import { CustomError } from "./error";

// Role hierarchy definition
const roleHierarchy = {
  superadmin: ["admin", "superadmin"],
  admin: ["admin"]
};

type RoleType = keyof typeof roleHierarchy;

/**
 * Middleware to check if the user has the required role
 * Implements role hierarchy where superadmin inherits admin permissions
 * @param requiredRole - The minimum role required to access the route
 */
export const checkRole = (requiredRole: RoleType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError("User not authenticated", 401));
    }

    const userRole = req.user.role as RoleType;

    // Validate if the user role exists in our hierarchy
    if (!roleHierarchy[userRole]) {
      return next(new CustomError("Invalid user role", 403));
    }

    // Check if user's role has access to the required role based on hierarchy
    if (!roleHierarchy[userRole].includes(requiredRole)) {
      return next(new CustomError("You don't have permission to perform this action", 403));
    }

    next();
  };
};