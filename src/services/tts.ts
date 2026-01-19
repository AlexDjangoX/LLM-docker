interface TTSOptions {
  text: string;
  voice?: string;
  provider?: "piper" | "coqui";
  model?: string;
  stability?: number;
  similarity_boost?: number;
}

export async function generateTTS(options: TTSOptions): Promise<Buffer> {
  const { text, voice, provider = "coqui", model, stability, similarity_boost } = options;

  switch (provider) {
    case "piper": {
      const piperUrl = process.env.PIPER_TTS_URL || "http://localhost:5000";
      const voiceName = voice || "en_US-lessac-medium";

      const response = await fetch(`${piperUrl}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: voiceName,
          output_format: "wav",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Piper TTS API error: ${response.status} ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    case "coqui": {
      const coquiUrl = process.env.COQUI_TTS_URL || "http://localhost:5002";
      // Default to XTTS v2 for high-quality multilingual TTS
      const modelName = model || "tts_models/multilingual/multi-dataset/xtts_v2";

      // Coqui TTS API format - XTTS v2 supports high-quality voice cloning
      const response = await fetch(`${coquiUrl}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_name: modelName,
          speaker_id: voice || null,
          language: "en", // XTTS supports multiple languages
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Coqui TTS API error: ${response.status} ${error}`);
      }

      // Coqui TTS returns audio as base64 or binary
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const result = (await response.json()) as { audio?: string };
        if (result.audio) {
          return Buffer.from(result.audio, "base64");
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    default:
      throw new Error(`Unsupported TTS provider: ${provider}`);
  }
}
