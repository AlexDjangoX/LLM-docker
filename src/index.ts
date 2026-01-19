import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ttsRouter } from "./routes/tts.js";
import { chatRouter } from "./routes/chat.js";
import { imageRouter } from "./routes/images.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow API responses
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - SECURE by default
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").filter(Boolean) || [];
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false, // No wildcard in production
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Request size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting - prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100, // requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Health check (no rate limit)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/tts", ttsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/images", imageRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "An error occurred" : err.message,
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 LLM Services running on http://localhost:${PORT}`);
  console.log(`📝 TTS: POST /api/tts`);
  console.log(`💬 Chat: POST /api/chat`);
  console.log(`🎨 Images: POST /api/images`);
  console.log(`🔒 Security: Rate limiting enabled`);
  if (allowedOrigins.length === 0) {
    console.warn(`⚠️  WARNING: CORS is disabled. Set ALLOWED_ORIGINS in production!`);
  }
});

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
