import request from 'supertest';
import { createTestApp } from '../helpers/test-app.js';

describe('Chat API - Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Create test app
    app = createTestApp();
  });

  // Generate unique test data for each test
  const getUniqueTestData = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    const uniqueId = `${timestamp}-${random}`;

    return {
      email: `chat-test-${uniqueId}@example.com`,
      username: `chattest${uniqueId}`,
      password: 'ChatTest123!'
    };
  };

  describe('POST /api/chat', () => {
    test('should generate chat response', async () => {
      const chatData = {
        message: 'Hello, can you help me with a simple question?',
        model: 'llama3.1:8b',
        temperature: 0.7
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('usage');
      expect(typeof response.body.response).toBe('string');
      expect(response.body.response.length).toBeGreaterThan(0);
      expect(response.body.usage).toHaveProperty('prompt_tokens');
      expect(response.body.usage).toHaveProperty('completion_tokens');
      expect(response.body.usage).toHaveProperty('total_tokens');
    });

    test('should work with authentication', async () => {
      // Register and login a test user
      const userData = getUniqueTestData();
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const userToken = registerResponse.body.tokens.accessToken;

      const chatData = {
        message: 'Tell me about education platforms.',
        model: 'llama3.1:8b'
      };

      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('usage');
    });

    test('should require message parameter', async () => {
      const chatData = {
        model: 'llama3.1:8b'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('message');
    });

    test('should handle different models', async () => {
      const chatData = {
        message: 'Say hello in Spanish',
        model: 'llama3.2:3b'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
    });

    test('should handle temperature parameter', async () => {
      const chatData = {
        message: 'Write a short poem about testing.',
        model: 'llama3.1:8b',
        temperature: 0.9
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
    });

    test('should handle low temperature for consistent responses', async () => {
      const chatData = {
        message: 'What is 2+2?',
        model: 'llama3.1:8b',
        temperature: 0.1
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.response.toLowerCase()).toContain('4');
    });

    test('should handle long messages', async () => {
      const longMessage = 'Please explain the concept of machine learning in detail. '.repeat(5);
      const chatData = {
        message: longMessage,
        model: 'llama3.1:8b'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.response.length).toBeGreaterThan(10);
    });

    test('should handle educational content requests', async () => {
      const chatData = {
        message: 'Explain photosynthesis to a 10-year-old child.',
        model: 'llama3.1:8b'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.response.length).toBeGreaterThan(20);
    });

    test('should handle bilingual requests', async () => {
      const chatData = {
        message: 'Translate "Hello, how are you?" to Polish and explain the grammar.',
        model: 'llama3.1:8b'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.response.toLowerCase()).toMatch(/cześć|dzień dobry/);
    });

    test('should handle empty response gracefully', async () => {
      // Mock might return empty response
      const chatData = {
        message: 'Respond with exactly one word: test',
        model: 'llama3.1:8b'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('usage');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle multiple requests within rate limit', async () => {
      const chatData = {
        message: 'Say "ok"',
        model: 'llama3.1:8b'
      };

      // Make multiple requests quickly
      const promises: any[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/chat')
            .send(chatData)
        );
      }

      const responses = await Promise.all(promises);

      // At least some should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle service unavailability gracefully', async () => {
      // This would test if the service handles Ollama being down
      const chatData = {
        message: 'Test message',
        model: 'nonexistent-model'
      };

      // The mock service should handle this gracefully
      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
    });
  });
});