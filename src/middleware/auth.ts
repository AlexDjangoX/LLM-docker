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
  
  // Extract token from "Bearer TOKEN" format, handling extra spaces
  let token: string | undefined;
  if (authHeader) {
    const trimmed = authHeader.trim();
    const parts = trimmed.split(/\s+/); // Split on one or more whitespace characters
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

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
  
  // Extract token from "Bearer TOKEN" format, handling extra spaces
  let token: string | undefined;
  if (authHeader) {
    const trimmed = authHeader.trim();
    const parts = trimmed.split(/\s+/); // Split on one or more whitespace characters
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      
      // Verify user exists in database
      const user = getUserById(decoded.userId);
      if (user) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
        };
      } else {
        // Token valid but user doesn't exist anymore
        console.log("Optional auth: user not found in database");
      }
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