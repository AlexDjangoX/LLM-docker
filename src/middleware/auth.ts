import { Request, Response, NextFunction } from "express";
import { verifyToken, getUserById } from "../services/auth.js";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
        role: string;
      };
    }
  }
}

// JWT authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Access token is required",
    });
  }

  try {
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);

    return res.status(403).json({
      error: "Authentication failed",
      message: "Invalid or expired token",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error) {
      // Silently fail - optional auth
      console.log("Optional auth failed, continuing without user");
    }
  }

  next();
};

// Admin-only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be logged in",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Insufficient permissions",
      message: "Admin access required",
    });
  }

  next();
};

// Rate limiting with user context (for authenticated users)
export const authenticatedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // If user is authenticated, they get higher limits
  if (req.user) {
    // Could implement different rate limits for authenticated users
    // For now, just continue
    next();
  } else {
    next();
  }
};