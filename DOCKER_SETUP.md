# Docker Setup Guide

## Quick Start

### 1. Create Environment File

```bash
cp .env.example .env
```

**For local development**, you can leave `ALLOWED_ORIGINS` empty (will show a warning but work).

**For production**, edit `.env` and set:
```bash
ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Build and Start All Services

```bash
docker-compose up -d --build
```

This will:
- ✅ Build the LLM Services API container
- ✅ Start Ollama (LLM for chat)
- ✅ Start Stable Diffusion (image generation)
- ✅ Start Coqui TTS (text-to-speech)
- ✅ Create Docker network and volumes

### 3. Check Status

```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs -f llm-services

# Test health endpoint
curl http://localhost:3000/health
```

### 4. Download Your First LLM Model (One-time)

```bash
# Download a high-quality model (recommended: llama3:8b)
docker exec -it ollama ollama pull llama3:8b

# Or download other models:
# docker exec -it ollama ollama pull mistral
# docker exec -it ollama ollama pull qwen2.5:7b
```

### 5. Test the API

```bash
# Test chat completion
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "provider": "ollama",
    "model": "llama3:8b"
  }'

# Test image generation (may take 30-60 seconds)
curl -X POST http://localhost:3000/api/images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "provider": "stable-diffusion"
  }'

# Test TTS
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test",
    "provider": "coqui"
  }' \
  --output test-audio.wav
```

## Individual Commands

### Build Only
```bash
docker-compose build
```

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes all data)
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f llm-services
docker-compose logs -f ollama
docker-compose logs -f stable-diffusion
docker-compose logs -f coqui-tts
```

### Restart a Service
```bash
docker-compose restart llm-services
```

## Service URLs

Once running, services are available at:

- **LLM Services API**: http://localhost:3000
- **Ollama**: http://localhost:11434
- **Stable Diffusion WebUI**: http://localhost:7860
- **Coqui TTS**: http://localhost:5002

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs llm-services

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port already in use
Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001 (or any available port)
```

### Out of memory
- Reduce model size (use smaller models like `llama3:8b` instead of `llama3:70b`)
- Increase Docker memory limit in Docker Desktop settings
- Use a server with more RAM

### Models not downloading
```bash
# Check Ollama is running
docker-compose ps ollama

# Check Ollama logs
docker-compose logs ollama

# Try pulling model again
docker exec -it ollama ollama pull llama3:8b
```

## Production Deployment

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for production deployment steps.

Key points:
1. Set `ALLOWED_ORIGINS` to your actual domain
2. Use reverse proxy (nginx/Traefik)
3. Enable SSL/TLS
4. Set up monitoring

## Resource Requirements

**Minimum** (for testing):
- 8GB RAM
- 4 vCPU
- 50GB storage

**Recommended** (for production):
- 16GB+ RAM
- 8+ vCPU
- 100GB+ storage
- GPU (optional, for faster image generation)

## Next Steps

1. ✅ Build and start: `docker-compose up -d --build`
2. ✅ Download models: `docker exec -it ollama ollama pull llama3:8b`
3. ✅ Test API endpoints
4. ✅ Configure for production (see PRODUCTION_CHECKLIST.md)
