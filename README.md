# Bilingual Education Platform - Self-Hosted AI Services

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

> **Self-Hosted AI Platform for English-Polish Bilingual Education** with professional-quality text-to-speech, translation, and conversational AI.

## Current Status

| Service | Status | Technology | Port | Notes |
|---------|--------|------------|------|-------|
| **API Gateway** | ✅ Active | Node.js/Express/TypeScript | 3000 | JWT auth, rate limiting |
| **Authentication** | ✅ Active | JWT + bcrypt | - | User management, password security |
| **Chat AI** | ✅ Active | Ollama (llama3.1:8b) | 11434 | Requires model download |
| **Translation** | ✅ Active | LibreTranslate | 5000 | EN ↔ PL optimized |
| **Text-to-Speech** | ✅ Active | XTTS v2 Neural TTS | 8000 | 22 speakers, 17 languages |
| **Image Generation** | ⏸️ Disabled | Stable Diffusion | 7860 | Requires NVIDIA GPU |

## Features

- **Professional Polish TTS** - XTTS v2 neural voices (not synthetic espeak)
- **Accurate Translation** - Dedicated LibreTranslate engine for EN ↔ PL
- **Educational Chat** - Ollama LLM for tutoring and conversation
- **Complete Data Sovereignty** - All processing happens locally
- **No API Keys Required** - Fully self-hosted, no external dependencies
- **Secure Authentication** - JWT-based user management with account controls
- **Password Security** - Strong password validation and secure hashing
- **Account Management** - Change password and self-delete accounts

---

## Quick Start

### Prerequisites

- Docker Desktop
- 16GB RAM recommended (8GB minimum)
- 50GB free disk space
- NVIDIA GPU (optional, for image generation)

### 1. Environment Setup

Environment variables are already configured in `.env` file with secure JWT secrets. For production deployment:

```bash
# Generate new secure JWT secrets:
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
```

**Note**: `setup-env.sh` and `env-config.txt` are kept for documentation/reference purposes only.

### Default Admin Account

The system includes a default admin account:
- **Email:** admin@example.com
- **Password:** admin123
- **⚠️ CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!**

### 2. Start Services

```bash
# Start all services (first run downloads ~5GB of models)
docker-compose up -d

# Watch startup progress
docker-compose logs -f
```

### 3. Download Ollama Model (First Time)

```bash
# Recommended for bilingual education (~8GB RAM)
docker exec ollama ollama pull llama3.1:8b

# Or lighter model (~4GB RAM)
docker exec ollama ollama pull llama3.2:3b
```

### 4. Verify Services

```bash
# Check all containers
docker-compose ps

# Test health endpoint
curl http://localhost:3000/health

# Test translation
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, how are you?","target":"pl"}'

# Test TTS speakers
curl http://localhost:3000/api/tts/voices
```

### 5. Start Frontend

```bash
cd ../self-hosted
npm install
npm run dev
# Open http://localhost:3001
```

---

## Costs

### Self-Hosted (Current Setup)

| Resource | One-Time | Monthly | Notes |
|----------|----------|---------|-------|
| **Hardware** | $0 | $0 | Uses your existing machine |
| **Electricity** | - | ~$5-15 | Depends on usage |
| **Disk Space** | - | - | ~50GB for models |
| **Total** | **$0** | **~$10** | No API fees, no subscriptions |

### Cloud Deployment (Hetzner Recommended)

| Server Type | Monthly | RAM | Best For |
|-------------|---------|-----|----------|
| **CPX31** | ~€15 | 8GB | Translation + TTS only |
| **CPX41** | ~€28 | 16GB | Full platform (no images) |
| **CPX51** | ~€65 | 32GB | Full platform + larger models |
| **GEX44** | ~€180 | 32GB + GPU | Full platform + image generation |

### Comparison with Cloud APIs

| Service | Self-Hosted | OpenAI/Azure/Google |
|---------|-------------|---------------------|
| **Chat (1M tokens)** | $0 | $3-60 |
| **TTS (1M chars)** | $0 | $15-30 |
| **Translation (1M chars)** | $0 | $20-40 |
| **Images (1000)** | $0* | $20-40 |

*Requires GPU server (~€180/mo) for practical image generation

---

## API Reference

### Health Check

```bash
GET /health
```

### Chat Completions

```bash
POST /api/chat
```

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful Polish-English tutor."},
    {"role": "user", "content": "Translate: Good morning"}
  ],
  "model": "llama3.1:8b"
}
```

### Translation

```bash
POST /api/translate
```

```json
{
  "text": "Hello, how are you?",
  "source": "auto",
  "target": "pl"
}
```

**Response:**
```json
{
  "success": true,
  "translation": "Cześć, jak się masz?",
  "source": "en",
  "target": "pl"
}
```

**Other Translation Endpoints:**
- `POST /api/translate/batch` - Translate multiple texts
- `POST /api/translate/detect` - Detect language
- `GET /api/translate/languages` - List supported languages

### Authentication

#### Register User
```bash
POST /api/auth/register
```

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "StrongPass123!"
}
```

#### Login
```bash
POST /api/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": "...",
    "email": "...",
    "username": "...",
    "role": "..."
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Change Password
```bash
POST /api/auth/change-password
Authorization: Bearer <access_token>
```

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "NewStrongPass123!",
  "confirmPassword": "NewStrongPass123!"
}
```

#### Delete Account
```bash
POST /api/auth/delete-account
Authorization: Bearer <access_token>
```

```json
{
  "password": "currentpassword"
}
```

#### Validate Password Strength
```bash
POST /api/auth/validate-password
```

```json
{
  "password": "passwordtocheck"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Text-to-Speech

```bash
POST /api/tts
Authorization: Bearer <access_token>
```

```json
{
  "text": "Dzień dobry! Hello!",
  "language": "pl",
  "speaker": "Claribel Dervla"
}
```

**Response:** Binary WAV audio

**Parameters:**
- `text` (required): Text to synthesize (max 50KB)
- `language`: `"en"` or `"pl"` (default: `"en"`)
- `speaker`: Speaker name from `/api/tts/voices` (default: `"Claribel Dervla"`)
- `speed`: 0.5 to 2.0 (default: 1.0)

**List Speakers:**
```bash
GET /api/tts/voices
Authorization: Bearer <access_token>
```

### Image Generation (Disabled)

```bash
POST /api/images
```

**Note:** Currently disabled. See [Enabling Image Generation](#enabling-image-generation-requires-gpu) below.

---

## Docker Services

### Active Services

| Service | Image | RAM | Startup |
|---------|-------|-----|---------|
| **llm-services** | Custom Node.js | 256MB | ~10s |
| **ollama** | `ollama/ollama:latest` | 4-8GB | ~30s + model |
| **xtts** | `ghcr.io/coqui-ai/xtts-streaming-server:latest-cpu` | 2-4GB | ~3 min |
| **libretranslate** | `libretranslate/libretranslate:latest` | 1-2GB | ~2 min |

### Volumes

```yaml
volumes:
  ollama-data:        # LLM models (~5-50GB)
  xtts-data:          # XTTS v2 model (~1.8GB)
  libretranslate-data: # Translation models (~500MB)
```

### Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f xtts

# Restart a service
docker-compose restart llm-services

# Check resource usage
docker stats

# Full reset (removes all data)
docker-compose down -v
```

---

## Enabling Image Generation (Requires GPU)

Image generation via Stable Diffusion is **disabled by default** because:
- Requires NVIDIA GPU with 8GB+ VRAM
- CPU generation takes 5-30 minutes per image
- Downloads ~4GB of model files

### To Enable (NVIDIA GPU Required)

1. **Edit `docker-compose.yml`** - Uncomment the `stable-diffusion` service:

```yaml
stable-diffusion:
  image: ghcr.io/ai-dock/stable-diffusion-webui:latest
  container_name: stable-diffusion
  ports:
    - "7860:7860"
  volumes:
    - stable-diffusion-data:/workspace
  environment:
    - WEBUI_FLAGS=--api --listen --port 7860
  restart: unless-stopped
  networks:
    - llm-network
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

2. **Uncomment the volume:**

```yaml
volumes:
  # ...
  stable-diffusion-data:
    name: stable-diffusion-data
```

3. **Restart services:**

```bash
docker-compose up -d
```

### Cloud GPU Options

For image generation without local GPU:

| Provider | Cost | Notes |
|----------|------|-------|
| **Hetzner GEX44** | ~€180/mo | Dedicated, reliable |
| **RunPod** | ~$0.20-0.50/hr | On-demand, pay-per-use |
| **Vast.ai** | ~$0.10-0.30/hr | Cheapest, variable |

---

## Project Structure

```
llm-services/
├── src/
│   ├── index.ts              # Express app entry
│   ├── routes/
│   │   ├── chat.ts           # POST /api/chat
│   │   ├── images.ts         # POST /api/images
│   │   ├── tts.ts            # POST /api/tts
│   │   └── translation.ts    # POST /api/translate
│   └── services/
│       ├── chat.ts           # Ollama integration
│       ├── images.ts         # Stable Diffusion integration
│       ├── tts.ts            # XTTS integration
│       └── translation.ts    # LibreTranslate integration
├── docker-compose.yml        # All services
├── Dockerfile                # API container
└── package.json

self-hosted/                  # Frontend (separate repo)
├── src/
│   ├── app/page.tsx
│   └── components/
│       ├── ChatInterface.tsx
│       ├── TextToSpeech.tsx
│       ├── Translation.tsx
│       └── ImageGenerator.tsx
└── package.json
```

---

## Performance

| Operation | Time (CPU) | Time (GPU) |
|-----------|------------|------------|
| Chat response | 2-10s | 1-3s |
| Translation | 0.5-2s | 0.5-2s |
| TTS (short text) | 20-30s | 2-5s |
| TTS (paragraph) | 30-60s | 5-15s |
| Image generation | 5-30 min | 10-60s |

### Resource Requirements

| Setup | RAM | CPU | Storage |
|-------|-----|-----|---------|
| **Minimum** | 8GB | 4 cores | 30GB |
| **Recommended** | 16GB | 8 cores | 50GB |
| **With Images** | 16GB + 8GB VRAM | 8 cores | 60GB |

---

## Troubleshooting

### XTTS Not Starting

XTTS downloads a 1.8GB model on first run (~3-5 minutes):

```bash
# Check progress
docker logs xtts

# If stuck, restart
docker-compose restart xtts
```

### Ollama "No Models"

```bash
# Download a model
docker exec ollama ollama pull llama3.1:8b

# Verify
docker exec ollama ollama list
```

### LibreTranslate Slow First Start

First run downloads language models (~2-3 minutes):

```bash
docker logs libretranslate
```

### TTS Takes Too Long

XTTS on CPU takes 20-30s per request. Options:
1. Keep text short (under 500 chars)
2. Use GPU server for faster generation
3. Pre-generate common phrases

### Out of Memory

```bash
# Check usage
docker stats

# Use smaller Ollama model
docker exec ollama ollama pull llama3.2:3b

# Increase Docker memory in Docker Desktop settings
```

---

## License

MIT License - Free for personal and commercial use.

---

**Built for the English-Polish bilingual education community.**
