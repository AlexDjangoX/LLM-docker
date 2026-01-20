import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { ttsRouter } from "../../src/routes/tts.js";
import { chatRouter } from "../../src/routes/chat.js";
import { imageRouter } from "../../src/routes/images.js";
import { translationRouter } from "../../src/routes/translation.js";
import { authRouter } from "../../src/routes/auth.js";
import { optionalAuth } from "../../src/middleware/auth.js";

// Create test app without starting server
export function createTestApp(): express.Application {
  // Load test environment
  dotenv.config({ path: './env-test.txt' });

  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
  }));

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Optional authentication for all routes
  app.use("/api/", optionalAuth);

  // API routes
  app.use("/api/tts", ttsRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/images", imageRouter);
  app.use("/api/translate", translationRouter);
  app.use("/api/auth", authRouter);

  // Health check
  app.get('/health', (req, res) => {
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    // Include user info if authenticated
    if ((req as any).user) {
      health.user = {
        userId: (req as any).user.id,
        username: (req as any).user.username,
        role: (req as any).user.role,
      };
    }

    res.json(health);
  });

  // Error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
      error: err.status ? 'Bad Request' : 'Internal Server Error',
      message: err.message,
    });
  });

  // Clean up any existing test data
  const dataDir = path.join(process.cwd(), 'data');
  const usersFile = path.join(dataDir, 'users.json');
  if (fs.existsSync(usersFile)) {
    fs.unlinkSync(usersFile);
  }

  return app;
}