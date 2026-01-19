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

  switch (provider) {
    case "stable-diffusion": {
      const stableDiffusionUrl = process.env.STABLE_DIFFUSION_URL || "http://localhost:7860";

      const response = await fetch(`${stableDiffusionUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, signature",
          steps: 50, // Higher steps = better quality
          width: parseInt(size.split("x")[0]),
          height: parseInt(size.split("x")[1]),
          cfg_scale: 7.5, // Higher CFG = better prompt adherence
          seed: -1,
          sampler_name: "DPM++ 2M Karras", // High quality sampler
          enable_hr: true, // High-res fix for better quality
          hr_scale: 2,
          hr_upscaler: "Latent",
        }),
      });

      if (!response.ok) {
        throw new Error(`Stable Diffusion API error: ${response.statusText}`);
      }

      const result = (await response.json()) as { images?: string[] };
      if (!result.images || result.images.length === 0) {
        throw new Error("No images returned from Stable Diffusion");
      }

      // Return as data URLs
      return result.images.map((img) => `data:image/png;base64,${img}`);
    }

    case "localai": {
      const localaiUrl = process.env.LOCALAI_BASE_URL || "http://localhost:8080";
      const modelName = model || "stablediffusion";
      const [width, height] = size.split("x").map(Number);

      const response = await fetch(`${localaiUrl}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          prompt,
          n: Math.min(n, 4), // Limit to 4 images
          size: `${width}x${height}`,
          quality,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LocalAI API error: ${response.status} ${error}`);
      }

      const result = (await response.json()) as {
        data?: Array<{ url?: string; b64_json?: string }>;
      };

      if (!result.data || result.data.length === 0) {
        throw new Error("No images returned from LocalAI");
      }

      // Return URLs or base64 data URLs
      return result.data.map((img) => {
        if (img.url) return img.url;
        if (img.b64_json) return `data:image/png;base64,${img.b64_json}`;
        return "";
      }).filter((url) => url !== "");
    }

    default:
      throw new Error(`Unsupported image provider: ${provider}`);
  }
}
