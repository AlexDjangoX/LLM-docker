import { Router } from "express";
import { generateChatCompletion } from "../services/chat.js";

export const chatRouter = Router();

interface ChatRequest {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string;
  provider?: "ollama" | "localai";
  temperature?: number;
  max_tokens?: number;
}

chatRouter.post("/", async (req, res) => {
  try {
    const {
      messages,
      model,
      provider = "ollama",
      temperature,
      max_tokens,
    } = req.body as ChatRequest;

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !["system", "user", "assistant"].includes(msg.role)) {
        return res.status(400).json({ error: "Invalid message role" });
      }
      if (!msg.content || typeof msg.content !== "string") {
        return res.status(400).json({ error: "Message content must be a string" });
      }
      if (msg.content.length > 100000) {
        return res.status(400).json({ error: "Message content too long (max 100KB)" });
      }
    }

    // Validate parameters
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return res.status(400).json({ error: "Temperature must be between 0 and 2" });
    }
    if (max_tokens !== undefined && (max_tokens < 1 || max_tokens > 100000)) {
      return res.status(400).json({ error: "max_tokens must be between 1 and 100000" });
    }

    const completion = await generateChatCompletion({
      messages,
      model,
      provider,
      temperature,
      max_tokens,
    });

    res.json(completion);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Failed to generate chat completion",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
