import { Router, Request, Response } from "express";
import { registerUser, loginUser, refreshAccessToken, getAllUsers, initializeDefaultAdmin, getUserByEmail, changeUserPassword, deleteUserAccount, validatePasswordStrength } from "../services/auth.js";
import { optionalAuth, requireAdmin } from "../middleware/auth.js";

export const authRouter = Router();

interface RegisterRequest extends Request {
  body: {
    email: string;
    username: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshRequest extends Request {
  body: {
    refreshToken: string;
  };
}

// POST /api/auth/register - Register new user
authRouter.post("/register", async (req: RegisterRequest, res: Response) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Email, username, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Validation error",
        message: "Password must be at least 6 characters long",
      });
    }

    const tokens = await registerUser({ email, username, password });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        email,
        username,
      },
      tokens,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return res.status(409).json({
          error: "Conflict",
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Registration failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/auth/login - Login user
authRouter.post("/login", async (req: LoginRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Email and password are required",
      });
    }

    const tokens = await loginUser({ email, password });

    // Get the full user object from the database
    const user = getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "User not found",
      });
    }

    const userInfo = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    res.json({
      message: "Login successful",
      user: userInfo,
      tokens,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(401).json({
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Invalid credentials",
    });
  }
});

// POST /api/auth/refresh - Refresh access token
authRouter.post("/refresh", async (req: RefreshRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Validation error",
        message: "Refresh token is required",
      });
    }

    const tokens = await refreshAccessToken(refreshToken);

    res.json({
      message: "Token refreshed successfully",
      tokens,
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    res.status(401).json({
      error: "Token refresh failed",
      message: error instanceof Error ? error.message : "Invalid refresh token",
    });
  }
});

// GET /api/auth/users - Get all users (admin only)
authRouter.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = getAllUsers();

    res.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      error: "Failed to retrieve users",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/auth/change-password - Change user password
authRouter.post("/change-password", optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to change your password",
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Validation error",
        message: "Current password, new password, and confirmation are required",
      });
    }

    await changeUserPassword(user.userId, currentPassword, newPassword, confirmPassword);

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);

    if (error instanceof Error) {
      if (error.message.includes("validation failed")) {
        return res.status(400).json({
          error: "Password validation failed",
          message: error.message,
        });
      }
      if (error.message.includes("incorrect")) {
        return res.status(401).json({
          error: "Authentication failed",
          message: error.message,
        });
      }
      if (error.message.includes("do not match")) {
        return res.status(400).json({
          error: "Validation error",
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Password change failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/auth/delete-account - Delete user account
authRouter.post("/delete-account", optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to delete your account",
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Password confirmation is required",
      });
    }

    await deleteUserAccount(user.userId, password);

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Admin accounts cannot be deleted")) {
        return res.status(403).json({
          error: "Operation not allowed",
          message: error.message,
        });
      }
      if (error.message.includes("incorrect")) {
        return res.status(401).json({
          error: "Authentication failed",
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Account deletion failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/auth/validate-password - Validate password strength
authRouter.post("/validate-password", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Password is required",
      });
    }

    const validation = validatePasswordStrength(password);

    res.json({
      isValid: validation.isValid,
      errors: validation.errors,
    });
  } catch (error) {
    console.error("Password validation error:", error);

    res.status(500).json({
      error: "Password validation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/auth/init-admin - Initialize default admin (one-time setup)
authRouter.post("/init-admin", async (req: Request, res: Response) => {
  try {
    await initializeDefaultAdmin();

    res.json({
      message: "Default admin user initialized",
      note: "Check console logs for admin credentials",
    });
  } catch (error) {
    console.error("Init admin error:", error);

    res.status(500).json({
      error: "Failed to initialize admin",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});