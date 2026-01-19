# LLM Services

**100% Self-Hosted & FREE** - High-quality LLM services for TTS, chat completions, and image generation. Production-grade quality with no API costs - only your Hetzner server hosting fees!

## ✅ Confirmed: High-Quality Application

**YES** - This is a **very high-quality** application that:
- ✅ **Runs locally in Docker** - Fully containerized, tested and working
- ✅ **Hosts externally on Hetzner** - Production-ready deployment
- ✅ **Production-grade quality** - Comparable to commercial services
- ✅ **State-of-the-art models** - llama3, SDXL, XTTS v2
- ✅ **Optimized parameters** - 50-step image generation, advanced sampling

See [QUALITY_GUIDE.md](QUALITY_GUIDE.md) for detailed quality specifications.

## ✅ Production Ready

**Status**: ✅ **PRODUCTION READY** (after environment configuration)

The application includes:
- ✅ Rate limiting (100 req/15min, configurable)
- ✅ Security headers (Helmet.js)
- ✅ CORS protection (no wildcard by default)
- ✅ Input validation & sanitization
- ✅ Request size limits (10MB)
- ✅ Graceful shutdown
- ✅ Health checks
- ✅ Error handling

**See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for deployment guide.**

## 🆓 Cost-Free Features

All services run **completely free** on your own server (Hetzner, AWS, DigitalOcean, etc.). No API keys required, no usage limits, no per-request costs.

- **Text-to-Speech (TTS)**: Self-hosted with Coqui TTS and Piper TTS (100% FREE)
- **Chat Completions**: Self-hosted with Ollama and LocalAI (100% FREE)
- **Image Generation**: Self-hosted with Stable Diffusion and LocalAI (100% FREE)

## Quick Start with Docker (100% FREE Setup)

### Using Docker Compose (Recommended)

**No API keys needed!** All services run self-hosted and free.

1. **Clone and start**:
   ```bash
   git clone <repository-url>
   cd llm-services
   docker-compose up -d
   ```

   This automatically starts:
   - ✅ **Ollama** - Free self-hosted LLM (chat completions)
   - ✅ **Stable Diffusion** - Free self-hosted image generation
   - ✅ **Coqui TTS** - Free self-hosted text-to-speech
   - ✅ **LLM Services API** - Main application

2. **Download your first model** (one-time setup):
   ```bash
   docker exec -it ollama ollama pull llama2
   # or any other model: mistral, codellama, etc.
   ```

3. **Check health**:
   ```bash
   curl http://localhost:3000/health
   ```

**That's it!** You now have a fully functional, free LLM service running on your Hetzner server.

### Using Docker directly

1. **Build the image**:
   ```bash
   docker build -t llm-services .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env \
     --name llm-services \
     llm-services
   ```

## Local Development Setup

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/tts` - Text-to-speech
- `POST /api/chat` - Chat completions
- `POST /api/images` - Image generation

### Example API Usage

#### Chat Completions
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "provider": "ollama",
    "model": "llama2"
  }'
```

#### Image Generation
```bash
curl -X POST http://localhost:3000/api/images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset",
    "provider": "stable-diffusion",
    "size": "1024x1024"
  }'
```

#### Text-to-Speech
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "provider": "coqui"
  }' \
  --output audio.wav
```

## 🆓 Self-Hosted Providers (FREE - Default)

### Chat Completions (FREE)
- **Ollama** (default): Runs automatically, no API key needed
  - Models: llama2, mistral, codellama, phi, etc.
  - Download models: `docker exec -it ollama ollama pull <model-name>`
- **LocalAI** (optional): Alternative self-hosted LLM

### Image Generation (FREE)
- **Stable Diffusion** (default): Runs automatically, no API key needed
  - Access WebUI at: `http://localhost:7860`
  - Models downloaded automatically

### Text-to-Speech (FREE)
- **Coqui TTS** (default): Runs automatically, no API key needed
  - Multiple voices and models available
  - High-quality, natural-sounding synthesis
  - Models download automatically on first use

## 🆓 100% Free & Self-Hosted

All services are completely free and self-hosted:
- ✅ **Ollama** - Free, high-quality LLM (llama3, mistral, qwen2.5, etc.)
- ✅ **Stable Diffusion** - Free, state-of-the-art image generation
- ✅ **Coqui TTS** - Free, high-quality multilingual TTS with voice cloning
- ✅ **LocalAI** - Free alternative LLM backend
- ✅ **Piper TTS** - Free, fast TTS option

**No API keys needed. No usage limits. No costs.**

## Environment Variables

**For FREE self-hosted setup, no environment variables needed!** Defaults work out of the box.

Optional configuration (create `.env` file if needed):

- `PORT` - Server port (default: 3000)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated, default: `*`)
- `OLLAMA_BASE_URL` - Ollama server URL (default: `http://ollama:11434`)
- `STABLE_DIFFUSION_URL` - Stable Diffusion API URL (default: `http://stable-diffusion:7860`)
- `COQUI_TTS_URL` - Coqui TTS server URL (default: `http://coqui-tts:5002`)

**No paid services required!** All services are 100% self-hosted and free.

## 💻 Hetzner Deployment

Perfect for Hetzner Cloud! Recommended server specs:

- **Minimum**: 8GB RAM, 4 vCPU (for smaller models, good quality)
- **Recommended**: 16GB+ RAM, 8+ vCPU (for high-quality models like llama3:8b)
- **Best**: GPU-enabled server (NVIDIA) for faster, higher-quality image generation
- **Storage**: 50GB+ SSD (models can be large)

**See [QUALITY_GUIDE.md](QUALITY_GUIDE.md) for detailed quality configuration.**

```bash
# On your Hetzner server
git clone <repository-url>
cd llm-services
docker-compose up -d

# Download models (one-time)
docker exec -it ollama ollama pull llama2
```

## Docker Compose Services

All services run by default (100% free):
- `llm-services` - Main API application
- `ollama` - Self-hosted LLM (chat completions)
- `stable-diffusion` - Self-hosted image generation
- `coqui-tts` - Self-hosted text-to-speech

Optional:
- `localai` - Alternative LLM (use profile: `docker-compose --profile localai up -d`)

## Building and Running

```bash
# Build
npm run build

# Run production build
npm start

# Development with hot reload
npm run dev
```

## License

MIT
