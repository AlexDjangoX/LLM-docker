/**
 * Translation Service - Professional EN ↔ PL Translation
 * Uses LibreTranslate for accurate, self-hosted translation
 * Optimized for bilingual educational content
 */

interface TranslationOptions {
  text: string;
  source: "en" | "pl" | "auto";
  target: "en" | "pl";
}

interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

interface LanguageInfo {
  code: string;
  name: string;
}

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || "http://libretranslate:5000";

/**
 * Translate text between English and Polish
 * Uses LibreTranslate for professional-quality translation
 */
export async function translate(options: TranslationOptions): Promise<TranslationResult> {
  const { text, source, target } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for translation");
  }

  if (source !== "auto" && source === target) {
    // No translation needed
    return { translatedText: text };
  }

  console.log(`Translation request: ${source} → ${target}, text length=${text.length}`);

  const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: source === "auto" ? "auto" : source,
      target: target,
      format: "text",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Translation API error: ${response.status} ${error}`);
  }

  const result = (await response.json()) as {
    translatedText: string;
    detectedLanguage?: { language: string; confidence: number };
  };

  return {
    translatedText: result.translatedText,
    detectedLanguage: result.detectedLanguage?.language,
    confidence: result.detectedLanguage?.confidence,
  };
}

/**
 * Detect the language of text
 */
export async function detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for language detection");
  }

  const response = await fetch(`${LIBRETRANSLATE_URL}/detect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: text }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Language detection error: ${response.status} ${error}`);
  }

  const results = (await response.json()) as Array<{ language: string; confidence: number }>;
  
  if (!results || results.length === 0) {
    throw new Error("Could not detect language");
  }

  return results[0];
}

/**
 * Get list of supported languages
 */
export async function getSupportedLanguages(): Promise<LanguageInfo[]> {
  const response = await fetch(`${LIBRETRANSLATE_URL}/languages`);

  if (!response.ok) {
    throw new Error(`Failed to fetch languages: ${response.status}`);
  }

  const languages = (await response.json()) as Array<{ code: string; name: string }>;
  return languages;
}

/**
 * Batch translate multiple texts (for efficiency)
 */
export async function batchTranslate(
  texts: string[],
  source: "en" | "pl" | "auto",
  target: "en" | "pl"
): Promise<TranslationResult[]> {
  // LibreTranslate doesn't have native batch API, so we parallelize
  const results = await Promise.all(
    texts.map((text) => translate({ text, source, target }))
  );
  return results;
}
