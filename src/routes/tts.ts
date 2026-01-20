import { Router } from "express";
import { generateTTS, listVoices } from "../services/tts.js";

export const ttsRouter = Router();

interface TTSRequest {
  text: string;
  language: "en" | "pl";
  speed?: number;
  speaker?: string;
}

// POST /api/tts - Generate speech from text
// Uses Coqui TTS with XTTS v2 model for professional multilingual neural TTS
ttsRouter.post("/", async (req, res) => {
  try {
    const { text, language, speed = 1.0, speaker } = req.body as TTSRequest;

    // Input validation
    if (!text || typeof text !== "string") {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "text is required and must be a string" 
      });
    }
    if (text.length > 50000) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "text too long (max 50KB)" 
      });
    }
    if (text.length < 1) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "text cannot be empty" 
      });
    }
    if (!language) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "language is required and must be 'en' or 'pl'" 
      });
    }
    // Language validation is done by the service to allow for service-specific error messages
    if (speed && (speed < 0.5 || speed > 2.0)) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "Speed must be between 0.5 and 2.0" 
      });
    }

    const audioData = await generateTTS({
      text,
      language,
      speed,
      speaker,
    });

    // Log user activity if authenticated
    if (req.user) {
      console.log(`TTS request by ${req.user.username}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    }

    // Coqui TTS returns WAV audio
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", 'attachment; filename="speech.wav"');
    res.send(audioData);
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({
      error: "Failed to generate speech",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/tts/voices - List available voices
ttsRouter.get("/voices", async (_req, res) => {
  try {
    const voices = await listVoices();
    res.json(voices);
  } catch (error) {
    console.error("Failed to list voices:", error);
    res.status(500).json({
      error: "Failed to list voices",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
