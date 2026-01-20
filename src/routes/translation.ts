import { Router, Request, Response } from "express";
import {
  translate,
  detectLanguage,
  getSupportedLanguages,
  batchTranslate,
} from "../services/translation.js";

export const translationRouter = Router();

interface TranslateRequest {
  text: string;
  source?: "en" | "pl" | "auto";
  target: "en" | "pl";
}

interface BatchTranslateRequest {
  texts: string[];
  source?: "en" | "pl" | "auto";
  target: "en" | "pl";
}

/**
 * POST /api/translate
 * Translate text between English and Polish
 */
translationRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { text, source = "auto", target } = req.body as TranslateRequest;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!target) {
      return res.status(400).json({ error: "Target language is required (en or pl)" });
    }

    if (!["en", "pl"].includes(target)) {
      return res.status(400).json({ error: "Target must be 'en' or 'pl'" });
    }

    if (!["en", "pl", "auto"].includes(source)) {
      return res.status(400).json({ error: "Source must be 'en', 'pl', or 'auto'" });
    }

    const result = await translate({ text, source, target });

    return res.json({
      success: true,
      translation: result.translatedText,
      source: result.detectedLanguage || source,
      target,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(500).json({
      error: "Translation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts at once (for educational content)
 */
translationRouter.post("/batch", async (req: Request, res: Response) => {
  try {
    const { texts, source = "auto", target } = req.body as BatchTranslateRequest;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "Array of texts is required" });
    }

    if (texts.length > 100) {
      return res.status(400).json({ error: "Maximum 100 texts per batch" });
    }

    if (!target || !["en", "pl"].includes(target)) {
      return res.status(400).json({ error: "Target must be 'en' or 'pl'" });
    }

    const results = await batchTranslate(texts, source, target);

    return res.json({
      success: true,
      translations: results.map((r) => r.translatedText),
      source,
      target,
    });
  } catch (error) {
    console.error("Batch translation error:", error);
    return res.status(500).json({
      error: "Batch translation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/translate/detect
 * Detect the language of text
 */
translationRouter.post("/detect", async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const result = await detectLanguage(text);

    return res.json({
      success: true,
      language: result.language,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Language detection error:", error);
    return res.status(500).json({
      error: "Language detection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/translate/languages
 * Get list of supported languages
 */
translationRouter.get("/languages", async (_req: Request, res: Response) => {
  try {
    const languages = await getSupportedLanguages();

    return res.json({
      success: true,
      languages,
    });
  } catch (error) {
    console.error("Failed to fetch languages:", error);
    return res.status(500).json({
      error: "Failed to fetch supported languages",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
