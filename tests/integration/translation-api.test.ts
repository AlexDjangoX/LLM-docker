import request from 'supertest';
import { createTestApp } from '../helpers/test-app.js';

describe('Translation API - Integration Tests', () => {
  let app: any;
  let userToken: string;

  beforeAll(async () => {
    // Create test app
    app = createTestApp();

    // Register and login a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'translation-test@example.com',
        username: 'translationtest',
        password: 'TranslationTest123!'
      });

    userToken = registerResponse.body.tokens.accessToken;
  });

  describe('POST /api/translate', () => {
    test('should translate text from English to Polish', async () => {
      const translationData = {
        text: 'Hello, how are you today?',
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
      expect(response.body).toHaveProperty('detectedLanguage', 'en');
      expect(response.body).toHaveProperty('confidence');
      expect(typeof response.body.translatedText).toBe('string');
      expect(response.body.translatedText.length).toBeGreaterThan(0);
    });

    test('should translate text from Polish to English', async () => {
      const translationData = {
        text: 'Cześć, jak się masz dzisiaj?',
        source: 'pl',
        target: 'en'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
      expect(response.body.translatedText.toLowerCase()).toMatch(/hello|hi/);
    });

    test('should work with authentication', async () => {
      const translationData = {
        text: 'Good morning!',
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(translationData)
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
    });

    test('should require text parameter', async () => {
      const translationData = {
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('text');
    });

    test('should require source language', async () => {
      const translationData = {
        text: 'Hello world',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('source');
    });

    test('should require target language', async () => {
      const translationData = {
        text: 'Hello world',
        source: 'en'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('target');
    });

    test('should handle long text translation', async () => {
      const longText = 'This is a very long text that needs to be translated from English to Polish. '.repeat(3);
      const translationData = {
        text: longText,
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
      expect(response.body.translatedText.length).toBeGreaterThan(10);
    });

    test('should handle educational content', async () => {
      const translationData = {
        text: 'Photosynthesis is the process by which plants convert sunlight into energy.',
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
      expect(response.body.translatedText.toLowerCase()).toMatch(/fotosynteza|rośliny/);
    });

    test('should handle auto-detection when source is auto', async () => {
      const translationData = {
        text: 'Bonjour, comment allez-vous?',
        source: 'auto',
        target: 'en'
      };

      const response = await request(app)
        .post('/api/translate')
        .send(translationData)
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
      expect(response.body).toHaveProperty('detectedLanguage');
    });
  });

  describe('POST /api/translate/batch', () => {
    test('should translate multiple texts', async () => {
      const batchData = {
        texts: [
          'Hello world',
          'How are you?',
          'Thank you very much'
        ],
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate/batch')
        .send(batchData)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      response.body.forEach((translation: any) => {
        expect(translation).toHaveProperty('translatedText');
        expect(translation).toHaveProperty('detectedLanguage', 'en');
        expect(translation).toHaveProperty('confidence');
      });
    });

    test('should handle empty batch', async () => {
      const batchData = {
        texts: [],
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate/batch')
        .send(batchData)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test('should require texts array', async () => {
      const batchData = {
        source: 'en',
        target: 'pl'
      };

      const response = await request(app)
        .post('/api/translate/batch')
        .send(batchData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('texts');
    });
  });

  describe('POST /api/translate/detect', () => {
    test('should detect language', async () => {
      const detectData = {
        text: 'Bonjour, comment allez-vous aujourd\'hui?'
      };

      const response = await request(app)
        .post('/api/translate/detect')
        .send(detectData)
        .expect(200);

      expect(response.body).toHaveProperty('detectedLanguage');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body.detectedLanguage).toBe('fr');
    });

    test('should detect English', async () => {
      const detectData = {
        text: 'Hello, this is a test message in English.'
      };

      const response = await request(app)
        .post('/api/translate/detect')
        .send(detectData)
        .expect(200);

      expect(response.body).toHaveProperty('detectedLanguage', 'en');
      expect(response.body).toHaveProperty('confidence');
    });

    test('should detect Polish', async () => {
      const detectData = {
        text: 'Cześć, to jest wiadomość testowa w języku polskim.'
      };

      const response = await request(app)
        .post('/api/translate/detect')
        .send(detectData)
        .expect(200);

      expect(response.body).toHaveProperty('detectedLanguage', 'pl');
      expect(response.body).toHaveProperty('confidence');
    });

    test('should require text parameter', async () => {
      const detectData = {};

      const response = await request(app)
        .post('/api/translate/detect')
        .send(detectData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('text');
    });
  });

  describe('GET /api/translate/languages', () => {
    test('should return supported languages', async () => {
      const response = await request(app)
        .get('/api/translate/languages')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const language = response.body[0];
      expect(language).toHaveProperty('code');
      expect(language).toHaveProperty('name');
    });

    test('should include English and Polish', async () => {
      const response = await request(app)
        .get('/api/translate/languages')
        .expect(200);

      const codes = response.body.map((lang: any) => lang.code);
      expect(codes).toContain('en');
      expect(codes).toContain('pl');
    });
  });
});