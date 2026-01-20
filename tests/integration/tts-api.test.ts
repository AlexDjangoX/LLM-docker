import request from 'supertest';
import { createTestApp } from '../helpers/test-app.js';

describe('TTS API - Integration Tests', () => {
  let app: any;
  let userToken: string;

  beforeAll(async () => {
    // Create test app
    app = createTestApp();

    // Register and login a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tts-test@example.com',
        username: 'ttstest',
        password: 'TtsTest123!'
      });

    userToken = registerResponse.body.tokens.accessToken;
  });

  describe('GET /api/tts/voices', () => {
    test('should return available voices', async () => {
      const response = await request(app)
        .get('/api/tts/voices')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(typeof response.body[0]).toBe('string');
    });

    test('should work with authentication', async () => {
      const response = await request(app)
        .get('/api/tts/voices')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/tts', () => {
    test('should generate TTS audio', async () => {
      const ttsData = {
        text: 'Hello, this is a test message.',
        language: 'en',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(200);

      // Should return audio buffer
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check content type
      expect(response.headers['content-type']).toContain('audio/wav');
    });

    test('should work with authentication', async () => {
      const ttsData = {
        text: 'Hello, authenticated user.',
        language: 'en',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ttsData)
        .expect(200);

      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    test('should require text parameter', async () => {
      const ttsData = {
        language: 'en',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('text');
    });

    test('should require language parameter', async () => {
      const ttsData = {
        text: 'Hello world',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('language');
    });

    test('should handle Polish language', async () => {
      const ttsData = {
        text: 'Cześć, to jest wiadomość testowa.',
        language: 'pl',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(200);

      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    test('should handle long text', async () => {
      const longText = 'This is a very long text that should be processed correctly by the TTS service. '.repeat(10);
      const ttsData = {
        text: longText,
        language: 'en',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(200);

      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    test('should handle special characters', async () => {
      const ttsData = {
        text: 'Hello @world! #test & more symbols: ©®™',
        language: 'en',
        speaker: 'Claribel Dervla'
      };

      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(200);

      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    test('should reject invalid language', async () => {
      const ttsData = {
        text: 'Hello world',
        language: 'invalid-lang',
        speaker: 'Claribel Dervla'
      };

      // Mock service will return error for invalid language
      const response = await request(app)
        .post('/api/tts')
        .send(ttsData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});