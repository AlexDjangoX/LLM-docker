interface TTSOptions {
  text: string;
  voice?: string;
  provider?: "opentts";
  model?: string;
  stability?: number;
  similarity_boost?: number;
}

export async function generateTTS(options: TTSOptions): Promise<Buffer> {
  const { text, voice, provider = "opentts", model, stability, similarity_boost } = options;

  // OpenTTS provides simple HTTP API for Piper TTS
  const openttsUrl = process.env.OPENTTS_URL || "http://opentts:5500";
  const voiceName = voice || "en_US/lessac/medium";

  const response = await fetch(`${openttsUrl}/api/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice: voiceName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenTTS API error: ${response.status} ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
