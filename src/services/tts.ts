interface TTSOptions {
  text: string;
  language?: "en" | "pl";
  speed?: number;
  speaker?: string;
}

// XTTS v2 has a 250-character hard limit, so we need to chunk long texts
const XTTS_MAX_CHARS = 240; // Leave some buffer for safety

interface SpeakerData {
  speaker_embedding: number[];
  gpt_cond_latent: number[][];
}

// Cache for speaker embeddings - loaded once per language
let speakerCache: Record<string, SpeakerData> | null = null;

async function getSpeakerEmbeddings(xttsUrl: string): Promise<Record<string, SpeakerData>> {
  if (speakerCache) return speakerCache;

  try {
    const response = await fetch(`${xttsUrl}/studio_speakers`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`XTTS speakers API error ${response.status}: ${errorText}`);
      throw new Error(`Failed to fetch speakers from XTTS service (${response.status}). Is XTTS service running?`);
    }
    
    speakerCache = (await response.json()) as Record<string, SpeakerData>;
    return speakerCache;
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch failed')) {
      console.error(`Cannot connect to XTTS service at ${xttsUrl}`);
      throw new Error(`XTTS service is not reachable at ${xttsUrl}. Please ensure the XTTS Docker container is running.`);
    }
    throw error;
  }
}

/**
 * Split text into chunks at sentence boundaries, respecting XTTS 250-char limit
 */
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  // If text is within limit, return as-is
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  
  // Split on sentence boundaries: . ! ? followed by space or end of string
  const sentences = text.split(/([.!?]+\s+|[.!?]+$)/);
  
  let currentChunk = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const segment = sentences[i];
    
    // Check if adding this segment would exceed limit
    if (currentChunk.length + segment.length <= maxChars) {
      currentChunk += segment;
    } else {
      // Save current chunk if not empty
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      
      // If single segment exceeds limit, split by words
      if (segment.length > maxChars) {
        const words = segment.split(/(\s+)/);
        let wordChunk = '';
        
        for (const word of words) {
          if (wordChunk.length + word.length <= maxChars) {
            wordChunk += word;
          } else {
            if (wordChunk.trim()) {
              chunks.push(wordChunk.trim());
            }
            wordChunk = word;
          }
        }
        
        currentChunk = wordChunk;
      } else {
        currentChunk = segment;
      }
    }
  }
  
  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Concatenate multiple WAV audio buffers into a single WAV file
 */
function concatenateWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error('No audio buffers to concatenate');
  }
  
  if (buffers.length === 1) {
    return buffers[0];
  }

  // WAV file structure:
  // - RIFF header (12 bytes)
  // - fmt chunk (24 bytes typically)
  // - data chunk (8 bytes header + audio data)
  
  // Extract audio data from each buffer (skip headers)
  const audioDataChunks: Buffer[] = [];
  let totalAudioSize = 0;
  
  for (const buffer of buffers) {
    // Find 'data' chunk
    const dataIndex = buffer.indexOf('data');
    if (dataIndex === -1) {
      console.warn('Invalid WAV buffer - no data chunk found');
      continue;
    }
    
    // Data chunk size is 4 bytes after 'data' marker
    const dataSize = buffer.readUInt32LE(dataIndex + 4);
    const audioStart = dataIndex + 8;
    const audioData = buffer.subarray(audioStart, audioStart + dataSize);
    
    audioDataChunks.push(audioData);
    totalAudioSize += audioData.length;
  }

  // Use first buffer as template for headers
  const firstBuffer = buffers[0];
  const dataIndex = firstBuffer.indexOf('data');
  
  // Create new buffer with combined audio
  const headerSize = dataIndex + 8; // Everything up to and including data chunk header
  const newBuffer = Buffer.alloc(headerSize + totalAudioSize);
  
  // Copy header from first buffer
  firstBuffer.copy(newBuffer, 0, 0, headerSize);
  
  // Update file size in RIFF header (total size - 8 bytes)
  newBuffer.writeUInt32LE(headerSize + totalAudioSize - 8, 4);
  
  // Update data chunk size
  newBuffer.writeUInt32LE(totalAudioSize, dataIndex + 4);
  
  // Copy all audio data
  let offset = headerSize;
  for (const audioData of audioDataChunks) {
    audioData.copy(newBuffer, offset);
    offset += audioData.length;
  }
  
  return newBuffer;
}

/**
 * Generate TTS for a single chunk of text
 */
async function generateTTSChunk(
  text: string,
  language: string,
  speakerData: SpeakerData,
  xttsUrl: string
): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min per chunk

  try {
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error(`XTTS API error ${response.status}: ${error}`);
      throw new Error(`XTTS API error: ${response.status} ${error}`);
    }

    // XTTS returns base64-encoded WAV audio wrapped in JSON quotes
    const responseText = await response.text();
    const base64Audio = responseText.replace(/^"|"$/g, '');

    if (!base64Audio || base64Audio.length === 0) {
      throw new Error('XTTS returned empty audio data');
    }

    return Buffer.from(base64Audio, 'base64');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateTTS(options: TTSOptions): Promise<Buffer> {
  const { text, language = "en", speaker = "Claribel Dervla" } = options;

  // XTTS Streaming Server - Professional multilingual neural TTS
  // XTTS v2 supports 17+ languages with natural-sounding voices
  const xttsUrl = process.env.XTTS_URL || "http://xtts:80";


  // Get speaker embeddings from the studio speakers
  const speakers = await getSpeakerEmbeddings(xttsUrl);
  const speakerData = speakers[speaker];
  
  if (!speakerData) {
    const availableSpeakers = Object.keys(speakers).slice(0, 5).join(", ");
    throw new Error(`Speaker "${speaker}" not found. Available: ${availableSpeakers}...`);
  }

  // XTTS v2 has a 250-character limit, so we need to chunk longer texts
  if (text.length > XTTS_MAX_CHARS) {
    
    const chunks = splitTextIntoChunks(text, XTTS_MAX_CHARS);
    
    // Generate TTS for each chunk
    const audioBuffers: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const buffer = await generateTTSChunk(chunk, language, speakerData, xttsUrl);
      audioBuffers.push(buffer);
      
    }
    
    // Concatenate all audio chunks
    const combinedAudio = concatenateWavBuffers(audioBuffers);
    
    return combinedAudio;
  }

  // Text is within limit, process normally
  return await generateTTSChunk(text, language, speakerData, xttsUrl);
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
