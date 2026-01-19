import { Router } from "express";
import { generateImage } from "../services/images.js";

export const imageRouter = Router();

interface ImageRequest {
  prompt: string;
  provider?: "stable-diffusion" | "localai";
  model?: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}

imageRouter.post("/", async (req, res) => {
  try {
    const {
      prompt,
      provider = "stable-diffusion",
      model,
      size = "1024x1024",
      quality = "hd",
      n = 1,
    } = req.body as ImageRequest;

    // Input validation
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required and must be a string" });
    }
    if (prompt.length > 10000) {
      return res.status(400).json({ error: "Prompt too long (max 10KB)" });
    }
    if (prompt.length < 1) {
      return res.status(400).json({ error: "Prompt cannot be empty" });
    }

    // Validate size
    const validSizes = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"];
    if (size && !validSizes.includes(size)) {
      return res.status(400).json({ error: `Invalid size. Must be one of: ${validSizes.join(", ")}` });
    }

    // Validate n
    if (n !== undefined && (n < 1 || n > 10)) {
      return res.status(400).json({ error: "n must be between 1 and 10" });
    }

    const images = await generateImage({
      prompt,
      provider,
      model,
      size,
      quality,
      n,
    });

    res.json({ images });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: "Failed to generate image",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
