import express from 'express';
import request from 'supertest';
import { optionalAuth } from '../../src/middleware/auth.js';
import { generateTokens, getUserById } from '../../src/services/auth.js';

// Mock getUserById for middleware testing
jest.mock('../../src/services/auth.js', () => ({
  ...jest.requireActual('../../src/services/auth.js'),
  getUserById: jest.fn()
}));

const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;

describe('Authentication Middleware - Unit Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Ensure test environment variables are set
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';

    // Reset mocks
    mockGetUserById.mockReset();
  });

  describe('optionalAuth middleware', () => {
    test('should attach user to request when valid token provided', async () => {
      // Create a test user and token
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens = generateTokens(testUser);
      mockGetUserById.mockReturnValue(testUser); // Mock getUserById to return the test user

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user
        });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.hasUser).toBe(true);
      expect(response.body.user).toEqual({
        userId: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: testUser.role
      });
    });

    test('should not attach user when no token provided', async () => {
      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user
        });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.hasUser).toBe(false);
      expect(response.body.user).toBeUndefined();
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    test('should not attach user when invalid token provided', async () => {
      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user
        });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(200);

      expect(response.body.hasUser).toBe(false);
      expect(response.body.user).toBeUndefined();
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    test('should not attach user when malformed authorization header', async () => {
      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user
        });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'InvalidFormat')
        .expect(200);

      expect(response.body.hasUser).toBe(false);
      expect(response.body.user).toBeUndefined();
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    test('should handle user not found in database', async () => {
      // Create a test user and token
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens = generateTokens(testUser);
      mockGetUserById.mockReturnValue(null); // User not found

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user
        });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.hasUser).toBe(false);
      expect(response.body.user).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledWith('test-user-123');
    });

    test('should handle expired tokens gracefully', async () => {
      // Create expired token manually
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY4OTM4NjIxLCJleHAiOjE3Njg5Mzg2MjJ9.example';

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user
        });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200);

      expect(response.body.hasUser).toBe(false);
      expect(response.body.user).toBeUndefined();
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    test('should handle admin user correctly', async () => {
      // Create admin user and token
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: 'adminhash',
        createdAt: new Date().toISOString(),
        role: 'admin' as const
      };

      const tokens = generateTokens(adminUser);
      mockGetUserById.mockReturnValue(adminUser);

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          user: (req as any).user,
          hasUser: !!(req as any).user,
          isAdmin: (req as any).user?.role === 'admin'
        });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.hasUser).toBe(true);
      expect(response.body.isAdmin).toBe(true);
      expect(response.body.user.role).toBe('admin');
    });

    test('should handle concurrent requests with different tokens', async () => {
      // Create two different users
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        username: 'user1',
        passwordHash: 'hash1',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        username: 'user2',
        passwordHash: 'hash2',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens1 = generateTokens(user1);
      const tokens2 = generateTokens(user2);

      mockGetUserById.mockImplementation((userId: string) => {
        if (userId === 'user-1') return user1;
        if (userId === 'user-2') return user2;
        return null;
      });

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({
          userId: (req as any).user?.userId,
          username: (req as any).user?.username
        });
      });

      // Make concurrent requests
      const [response1, response2] = await Promise.all([
        request(app)
          .get('/test')
          .set('Authorization', `Bearer ${tokens1.accessToken}`),
        request(app)
          .get('/test')
          .set('Authorization', `Bearer ${tokens2.accessToken}`)
      ]);

      expect(response1.body.userId).toBe('user-1');
      expect(response1.body.username).toBe('user1');
      expect(response2.body.userId).toBe('user-2');
      expect(response2.body.username).toBe('user2');
    });
  });

  describe('Authorization header parsing', () => {
    test('should handle Bearer token with extra spaces', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens = generateTokens(testUser);
      mockGetUserById.mockReturnValue(testUser);

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({ hasUser: !!(req as any).user });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `  Bearer   ${tokens.accessToken}  `)
        .expect(200);

      expect(response.body.hasUser).toBe(true);
    });

    test('should handle lowercase bearer', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens = generateTokens(testUser);
      mockGetUserById.mockReturnValue(testUser);

      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({ hasUser: !!(req as any).user });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.hasUser).toBe(true);
    });

    test('should reject non-Bearer tokens', async () => {
      // Setup test route with middleware
      app.use('/test', optionalAuth, (req, res) => {
        res.json({ hasUser: !!(req as any).user });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(200);

      expect(response.body.hasUser).toBe(false);
    });
  });
});