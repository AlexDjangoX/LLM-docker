interface TTSOptions {
  text: string;
  language?: "en" | "pl";
  speed?: number;
  speaker?: string;
}

interface SpeakerData {
  speaker_embedding: number[];
  gpt_cond_latent: number[][];
}

// Cache for speaker embeddings - loaded once per language
let speakerCache: Record<string, SpeakerData> | null = null;

async function getSpeakerEmbeddings(xttsUrl: string): Promise<Record<string, SpeakerData>> {
  if (speakerCache) return speakerCache;

  const response = await fetch(`${xttsUrl}/studio_speakers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch speakers: ${response.status}`);
  }
  
  speakerCache = (await response.json()) as Record<string, SpeakerData>;
  return speakerCache;
}

export async function generateTTS(options: TTSOptions): Promise<Buffer> {
  const { text, language = "en", speaker = "Claribel Dervla" } = options;

  // XTTS Streaming Server - Professional multilingual neural TTS
  // XTTS v2 supports 17+ languages with natural-sounding voices
  const xttsUrl = process.env.XTTS_URL || "http://xtts:80";

  console.log(`TTS request: language=${language}, speaker=${speaker}, text length=${text.length}`);

  // Get speaker embeddings from the studio speakers
  const speakers = await getSpeakerEmbeddings(xttsUrl);
  const speakerData = speakers[speaker];
  
  if (!speakerData) {
    const availableSpeakers = Object.keys(speakers).slice(0, 5).join(", ");
    throw new Error(`Speaker "${speaker}" not found. Available: ${availableSpeakers}...`);
  }

  // XTTS API requires speaker embeddings and GPT conditioning latents
  const response = await fetch(`${xttsUrl}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      language: language,
      speaker_embedding: speakerData.speaker_embedding,
      gpt_cond_latent: speakerData.gpt_cond_latent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`XTTS API error: ${response.status} ${error}`);
  }

  // XTTS returns base64-encoded WAV audio wrapped in JSON quotes
  const responseText = await response.text();
  
  // Remove surrounding quotes if present
  const base64Audio = responseText.replace(/^"|"$/g, '');
  
  // Decode base64 to binary
  return Buffer.from(base64Audio, 'base64');
}

// Get available speakers and languages
export async function listVoices(): Promise<string[]> {
  const xttsUrl = process.env.XTTS_URL || "http://xtts:80";
  
  try {
    const speakers = await getSpeakerEmbeddings(xttsUrl);
    return Object.keys(speakers);
  } catch {
    // Fallback to default speaker list
    return ["Claribel Dervla", "Daisy Studious", "Gracie Wise", "Tammie Ema", "Alison Dietlinde"];
  }
}
