import { Router } from "express";
import { generateTTS } from "../services/tts.js";

export const ttsRouter = Router();

interface TTSRequest {
  text: string;
  voice?: string;
  provider?: "piper" | "coqui";
  model?: string;
  stability?: number;
  similarity_boost?: number;
}

ttsRouter.post("/", async (req, res) => {
  try {
    const { text, voice, provider = "coqui", model, stability, similarity_boost } = req.body as TTSRequest;

    // Input validation
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required and must be a string" });
    }
    if (text.length > 50000) {
      return res.status(400).json({ error: "Text too long (max 50KB)" });
    }
    if (text.length < 1) {
      return res.status(400).json({ error: "Text cannot be empty" });
    }

    const audioData = await generateTTS({
      text,
      voice,
      provider,
      model,
      stability,
      similarity_boost,
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioData);
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({
      error: "Failed to generate speech",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
