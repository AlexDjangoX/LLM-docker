# LLM Services - Self-Hosted AI Services

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-145%20passing-brightgreen.svg)](https://github.com)

> **Production-ready AI services platform** for English-Polish bilingual education featuring professional text-to-speech, translation, chat completion, and secure authentication.

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

### AI Services
- **Neural Text-to-Speech** - XTTS v2 with 22 professional voices across 17 languages
- **Machine Translation** - LibreTranslate engine optimized for EN ↔ PL translation
- **Chat Completions** - Ollama LLM integration with streaming support
- **Image Generation** - Stable Diffusion integration (GPU required, disabled by default)

### Security & Authentication
- **JWT-based Authentication** - Secure token-based auth with access and refresh tokens
- **Password Security** - bcrypt hashing with configurable salt rounds and strong validation
- **Role-based Access Control** - User and admin roles with permission middleware
- **Rate Limiting** - Configurable rate limits per endpoint with user context awareness

### Developer Experience
- **Comprehensive Test Suite** - 145 tests (8 test suites) covering unit and integration scenarios
- **TypeScript** - Full type safety with strict mode enabled
- **RESTful API** - Well-documented endpoints with consistent error handling
- **Docker Compose** - Complete containerized deployment with health checks
- **Self-hosted** - Complete data sovereignty, no external API dependencies

---

## Technical Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Language** | TypeScript | 5.3+ |
| **Framework** | Express.js | 4.18+ |
| **Authentication** | JWT + bcrypt | - |
| **Testing** | Jest + Supertest | 29+ |
| **Containerization** | Docker Compose | 3.8+ |
| **AI Services** | Ollama, XTTS v2, LibreTranslate, Stable Diffusion | Latest |

---

## Quick Start

### Prerequisites

- Docker Desktop
- 16GB RAM recommended (8GB minimum)
- 50GB free disk space
- NVIDIA GPU (optional, for image generation)

### 1. Environment Setup

**Development:**
```bash
# Use provided test environment
cp env-test.txt .env
```

**Production:**
```bash
# Generate secure JWT secrets
export JWT_SECRET=$(openssl rand -hex 64)
export JWT_REFRESH_SECRET=$(openssl rand -hex 64)

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
OLLAMA_BASE_URL=http://ollama:11434
XTTS_BASE_URL=http://xtts:8000
LIBRETRANSLATE_URL=http://libretranslate:5000
EOF
```

⚠️ **Security Note:** Default admin credentials (`admin@example.com` / `admin123`) are created on first run. **Change immediately in production.**

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

## Development

### Running Tests

The project includes a comprehensive test suite with 145 tests covering all major functionality:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only

# Watch mode for development
npm run test:watch
```

**Test Coverage:**
- **Unit Tests:** 121 tests (Auth service, JWT, password validation, middleware)
- **Integration Tests:** 24 tests (API endpoints with mocked services)
- **Coverage:** Authentication, authorization, validation, error handling

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

### Project Structure

```
src/
├── index.ts              # Application entry point
├── middleware/
│   └── auth.ts          # JWT authentication middleware
├── routes/
│   ├── auth.ts          # Authentication endpoints
│   ├── chat.ts          # Chat completion endpoints
│   ├── images.ts        # Image generation endpoints
│   ├── translation.ts   # Translation endpoints
│   └── tts.ts           # Text-to-speech endpoints
└── services/
    ├── auth.ts          # Auth business logic
    ├── chat.ts          # Ollama integration
    ├── images.ts        # Stable Diffusion integration
    ├── translation.ts   # LibreTranslate integration
    └── tts.ts           # XTTS integration

tests/
├── setup.ts             # Jest configuration and mocks
├── unit/                # Unit tests
│   ├── auth.test.ts
│   ├── jwt-auth.test.ts
│   ├── middleware-auth.test.ts
│   └── password-validation.test.ts
└── integration/         # Integration tests
    ├── auth-api.test.ts
    ├── chat-api.test.ts
    ├── translation-api.test.ts
    └── tts-api.test.ts
```

---

## API Reference

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T20:00:00.000Z",
  "services": {
    "api": "operational"
  }
}
```

### Chat Completions

```bash
POST /api/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful Polish-English tutor."},
    {"role": "user", "content": "Translate: Good morning"}
  ],
  "model": "llama3.1:8b",
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Alternative Simple Format:**
```json
{
  "message": "What is photosynthesis?",
  "model": "llama3.1:8b"
}
```

**Response:**
```json
{
  "response": "Photosynthesis is the process by which plants...",
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

**Parameters:**
- `messages` (array, required*): Array of message objects with `role` and `content`
- `message` (string, required*): Simple single message (auto-converted to messages array)
- `model` (string, optional): Ollama model name (default: "llama2")
- `temperature` (number, optional): Sampling temperature 0-2 (default: 0.7)
- `max_tokens` (number, optional): Maximum completion tokens (default: 2000)

*Either `messages` or `message` is required

### Translation

```bash
POST /api/translate
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "source": "en",
  "target": "pl"
}
```

**Response:**
```json
{
  "success": true,
  "translatedText": "Cześć, jak się masz?",
  "detectedLanguage": "en",
  "target": "pl",
  "confidence": 0.95
}
```

**Parameters:**
- `text` (string, required): Text to translate
- `source` (string, required): Source language code ("en", "pl", "auto")
- `target` (string, required): Target language code ("en", "pl")

#### Batch Translation

```bash
POST /api/translate/batch
```

**Request:**
```json
{
  "texts": ["Hello", "How are you?", "Thank you"],
  "source": "en",
  "target": "pl"
}
```

**Response:** Array of translation objects
```json
[
  {
    "translatedText": "Cześć",
    "detectedLanguage": "en",
    "confidence": 0.95
  },
  ...
]
```

#### Language Detection

```bash
POST /api/translate/detect
```

**Request:**
```json
{
  "text": "Bonjour, comment allez-vous?"
}
```

**Response:**
```json
{
  "success": true,
  "detectedLanguage": "fr",
  "confidence": 0.98
}
```

#### Supported Languages

```bash
GET /api/translate/languages
```

**Response:** Array of language objects
```json
[
  {"code": "en", "name": "English"},
  {"code": "pl", "name": "Polish"},
  ...
]
```

### Authentication

All authenticated endpoints require an `Authorization` header:
```
Authorization: Bearer <access_token>
```

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json
```

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "StrongPass123!"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Login
```bash
POST /api/auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": "abc123",
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Token Expiry:**
- Access Token: 1 hour
- Refresh Token: 7 days

#### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
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
Content-Type: application/json
```

**Request:**
```json
{
  "password": "TestPassword123!"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "message": "Password meets all requirements"
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Password validation failed",
  "errors": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one special character"
  ]
}
```

#### Get All Users (Admin Only)
```bash
GET /api/auth/users
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
[
  {
    "id": "abc123",
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "lastLogin": "2026-01-20T12:00:00.000Z"
  },
  ...
]
```

### Text-to-Speech

```bash
POST /api/tts
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "text": "Dzień dobry! Hello!",
  "language": "pl",
  "speaker": "Claribel Dervla",
  "speed": 1.0
}
```

**Response:** Binary WAV audio file (Content-Type: `audio/wav`)

**Parameters:**
- `text` (string, required): Text to synthesize (max 50KB, automatically chunked)
- `language` (string, required): Language code - `"en"` or `"pl"`
- `speaker` (string, optional): Speaker name from `/api/tts/voices`
- `speed` (number, optional): Speech rate 0.5-2.0 (default: 1.0)

**Technical Details:**
- XTTS v2 has an internal 250-character limit per request
- Longer texts are automatically split at sentence boundaries
- Audio chunks are seamlessly concatenated into a single WAV file
- Maximum supported length: 50,000 characters (~4-5 minutes of audio)
- Processing time: ~30-60 seconds per 250-character chunk on CPU

**List Available Voices:**
```bash
GET /api/tts/voices
Authorization: Bearer <access_token>
```

**Response:** Array of speaker names
```json
[
  "Claribel Dervla",
  "Drew",
  "Paul",
  "Dora",
  "Thomas",
  "Emma",
  "Michael",
  "Laura",
  ...
]
```

### Image Generation (Disabled)

```bash
POST /api/images
```

**Note:** Image generation is disabled by default. Requires NVIDIA GPU. See [Enabling Image Generation](#enabling-image-generation-requires-gpu) below.

### Error Handling

All endpoints follow a consistent error response format:

**Error Response Structure:**
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": "Additional context (optional)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Example Error Responses:**

```json
// 400 - Validation Error
{
  "error": "Validation failed",
  "message": "Password must be at least 8 characters long"
}

// 401 - Authentication Error
{
  "error": "Authentication required",
  "message": "Access token is required"
}

// 403 - Authorization Error
{
  "error": "Insufficient permissions",
  "message": "Admin access required"
}
```

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

### TTS "Failed to generate speech" Error

This is the most common error. Run the diagnostic:

```bash
node check-xtts.js
```

**Quick fixes:**
1. Check if XTTS is running: `docker ps | grep xtts`
2. If not running: `docker-compose up -d xtts`
3. Check logs: `docker logs xtts`
4. Verify environment: `echo $XTTS_URL` (should be `http://xtts:80`)

**See [TROUBLESHOOTING-TTS.md](./TROUBLESHOOTING-TTS.md) for detailed guide.**

### TTS Takes Too Long

XTTS on CPU processes at ~30-60s per 250-character chunk. For long texts:
1. Expected processing time = `(text.length / 240) * 45 seconds`
2. Example: 1000 characters = ~4 chunks = ~3 minutes
3. Options for faster processing:
   - Use GPU server (5-10x faster)
   - Pre-generate common phrases
   - Keep text under 500 characters for quick responses

### TTS Text Cut Off / Incomplete

✅ **Fixed** - The service now automatically chunks long texts:
- Texts are split at sentence boundaries every 240 characters
- Chunks are processed sequentially
- Audio is seamlessly concatenated
- Maximum supported: 50,000 characters (~4-5 minutes of audio)

If you're still experiencing cutoffs:
1. Check backend logs: `docker-compose logs -f llm-services`
2. Verify chunking is working (look for "Split into N chunks")
3. Ensure XTTS timeout is sufficient in `docker-compose.yml`

### Out of Memory

```bash
# Check usage
docker stats

# Use smaller Ollama model
docker exec ollama ollama pull llama3.2:3b

# Increase Docker memory in Docker Desktop settings
```

---

## Security Considerations

### Production Deployment Checklist

- [ ] Generate unique JWT secrets using `openssl rand -hex 64`
- [ ] Change default admin password immediately
- [ ] Enable HTTPS/TLS for all API endpoints
- [ ] Configure appropriate rate limiting for your use case
- [ ] Review and restrict CORS origins in production
- [ ] Set up proper logging and monitoring
- [ ] Implement backup strategy for user data (`data/users.json`)
- [ ] Configure firewall rules to restrict service access
- [ ] Review and update Docker container security settings
- [ ] Enable security headers (Helmet is already configured)

### Authentication Security

- JWT tokens use HS256 algorithm with configurable secrets
- Passwords are hashed using bcrypt with 12 salt rounds
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Token verification happens on every protected endpoint
- Admin-only endpoints require role validation

### Data Storage

User data is stored in `data/users.json` with the following structure:
- Passwords: bcrypt hashed, never stored in plaintext
- Tokens: Generated fresh on each login, not persisted
- User metadata: ID, email, username, role, timestamps

**Backup recommendation:** Regular backups of `data/users.json` for production deployments.

---

## Contributing

### Code Style

- TypeScript strict mode enabled
- ESLint configuration included
- Consistent error handling patterns
- Comprehensive test coverage required for new features

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Run type checking (`npm run type-check`)
6. Run linting (`npm run lint`)
7. Commit changes with clear commit messages
8. Push to your fork and submit a Pull Request

---

## License

MIT License - Free for personal and commercial use.

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Support & Documentation

- **GitHub Issues:** [Report bugs or request features](https://github.com)
- **API Documentation:** See [API Reference](#api-reference) section above
- **Docker Documentation:** See [Docker Services](#docker-services) section
- **Test Documentation:** Run `npm test` to execute the comprehensive test suite

---

**Built for the English-Polish bilingual education community.**
