interface ImageOptions {
  prompt: string;
  provider?: "localai" | "stable-diffusion";
  model?: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}

export async function generateImage(options: ImageOptions): Promise<string[]> {
  const {
    prompt,
    provider = "stable-diffusion",
    model,
    size = "1024x1024",
    quality = "hd",
    n = 1,
  } = options;

  // Default to LocalAI for turnkey solution
if (provider === "localai" || !provider) {
  try {
    return await generateLocalAIImage(prompt, size);
  } catch (error) {
    console.warn("LocalAI failed, falling back to simple generation:", error);
    // Fallback to simple approach if LocalAI fails
  }
}

// Fallback: simple placeholder image generation (for development)
console.log(`Generating placeholder image for: "${prompt}"`);
const width = parseInt(size.split("x")[0]);
const height = parseInt(size.split("x")[1]);

// Create a simple colored rectangle as base64 (placeholder)
const svgData = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle" dy=".3em">
    AI Generated Image
  </text>
  <text x="50%" y="70%" font-family="Arial" font-size="16" fill="#999" text-anchor="middle" dy=".3em">
    ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}
  </text>
</svg>
`;

const base64Svg = Buffer.from(svgData).toString('base64');
return [`data:image/svg+xml;base64,${base64Svg}`];

async function generateLocalAIImage(prompt: string, size: string): Promise<string[]> {
  const localaiUrl = process.env.LOCALAI_BASE_URL || "http://localai:8080";

  const response = await fetch(`${localaiUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "stablediffusion",
      prompt,
      size,
      n: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LocalAI API error: ${response.status} ${error}`);
  }

  const result = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  if (!result || !result.data || result.data.length === 0) {
    throw new Error("No images returned from LocalAI");
  }

  return result.data.map((img: { b64_json?: string; url?: string }) => {
    if (img.b64_json) return `data:image/png;base64,${img.b64_json}`;
    if (img.url) return img.url;
    return "";
  }).filter((url: string) => url !== "");
}
}
