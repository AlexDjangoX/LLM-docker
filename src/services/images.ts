interface ImageOptions {
  prompt: string;
  provider?: "stable-diffusion" | "localai";
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

  // Use Stable Diffusion Automatic1111 for reliable image generation
  const stableDiffusionUrl = process.env.STABLE_DIFFUSION_URL || "http://stable-diffusion:7860";

  const response = await fetch(`${stableDiffusionUrl}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, signature, text, watermark",
      steps: 20, // Faster generation for testing
      width: parseInt(size.split("x")[0]),
      height: parseInt(size.split("x")[1]),
      cfg_scale: 7.5,
      seed: -1,
      sampler_name: "Euler a",
      enable_hr: false, // Disable high-res for faster generation
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stable Diffusion API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = (await response.json()) as { images?: string[] };
  if (!result.images || result.images.length === 0) {
    throw new Error("No images returned from Stable Diffusion");
  }

  // Return as data URLs
  return result.images.map((img) => `data:image/png;base64,${img}`);
}

