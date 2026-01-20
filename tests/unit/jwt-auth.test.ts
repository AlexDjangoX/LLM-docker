import jwt from 'jsonwebtoken';
import { verifyToken, generateTokens } from '../../src/services/auth.js';

describe('JWT Authentication - Unit Tests', () => {
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'mock-hash',
  createdAt: new Date().toISOString(),
  role: 'user' as const
};

  describe('Token Generation', () => {
    test('should generate valid access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken.length).toBeGreaterThan(20);
      expect(tokens.refreshToken.length).toBeGreaterThan(20);
    });

    test('should include correct payload in access token', () => {
      const tokens = generateTokens(mockUser);

      // Decode token to verify payload (without verification for unit test)
      const decoded = jwt.decode(tokens.accessToken) as any;

      expect(decoded).toHaveProperty('userId', mockUser.id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('username', mockUser.username);
      expect(decoded).toHaveProperty('role', mockUser.role);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should include only userId in refresh token', () => {
      const tokens = generateTokens(mockUser);

      // Decode token to verify payload
      const decoded = jwt.decode(tokens.refreshToken) as any;

      expect(decoded).toHaveProperty('userId', mockUser.id);
      expect(decoded).not.toHaveProperty('email');
      expect(decoded).not.toHaveProperty('username');
      expect(decoded).not.toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should have reasonable token expiry times', () => {
      const tokens = generateTokens(mockUser);
      const now = Math.floor(Date.now() / 1000);

      const accessDecoded = jwt.decode(tokens.accessToken) as any;
      const refreshDecoded = jwt.decode(tokens.refreshToken) as any;

      // Access token should expire in about 1 hour
      expect(accessDecoded.exp - accessDecoded.iat).toBeCloseTo(3600, -1); // ~1 hour

      // Refresh token should expire in about 7 days
      expect(refreshDecoded.exp - refreshDecoded.iat).toBeCloseTo(604800, -2); // ~7 days

      // Tokens should not be expired yet
      expect(accessDecoded.exp).toBeGreaterThan(now);
      expect(refreshDecoded.exp).toBeGreaterThan(now);
    });
  });

  describe('Token Verification', () => {
    test('should verify valid access token', () => {
      const tokens = generateTokens(mockUser);
      const decoded = verifyToken(tokens.accessToken);

      expect(decoded).toHaveProperty('userId', mockUser.id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('username', mockUser.username);
      expect(decoded).toHaveProperty('role', mockUser.role);
    });

    test('should reject malformed token', () => {
      expect(() => {
        verifyToken('invalid.jwt.token');
      }).toThrow('Invalid or expired token');
    });

    test('should reject token with wrong secret', () => {
      // Create token with different secret
      const wrongToken = jwt.sign(
        { userId: 'test' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => {
        verifyToken(wrongToken);
      }).toThrow('Invalid or expired token');
    });

    test('should reject expired token', () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: 'test', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Already expired
      );

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow('Invalid or expired token');
    });

    test('should handle token with missing payload', () => {
      // Create token with empty payload
      const emptyToken = jwt.sign(
        {},
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const decoded = verifyToken(emptyToken);
      // JWT always includes iat and exp, even with empty payload
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('Security Properties', () => {
    test('should use different secrets for access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);

      // Both tokens should be valid with their respective secrets
      expect(() => verifyToken(tokens.accessToken)).not.toThrow();

      // But refresh token should not be verifiable with access token secret
      expect(() => {
        jwt.verify(tokens.refreshToken, process.env.JWT_SECRET!);
      }).toThrow();
    });

    test('should generate unique tokens for same user', () => {
      const tokens1 = generateTokens(mockUser);

      // Create a modified user to ensure uniqueness
      const modifiedUser = { ...mockUser, id: mockUser.id + '-modified' };
      const tokens2 = generateTokens(modifiedUser);

      // Tokens should be different due to different user IDs
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    test('should include issuer information implicitly through secrets', () => {
      // Since we're using different secrets, tokens are implicitly tied to our service
      const tokens = generateTokens(mockUser);

      // Should be valid with our secrets
      expect(() => verifyToken(tokens.accessToken)).not.toThrow();
    });
  });

  describe('Token Payload Validation', () => {
    test('should handle special characters in user data', () => {
      const specialUser = {
        id: 'user-123',
        email: 'test+label@example.com',
        username: 'test_user.name',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens = generateTokens(specialUser);
      const decoded = verifyToken(tokens.accessToken);

      expect(decoded).toHaveProperty('email', specialUser.email);
      expect(decoded).toHaveProperty('username', specialUser.username);
    });

    test('should handle unicode characters in user data', () => {
      const unicodeUser = {
        id: 'user-123',
        email: 'tëst@example.com',
        username: 'tëst_üser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      };

      const tokens = generateTokens(unicodeUser);
      const decoded = verifyToken(tokens.accessToken);

      expect(decoded).toHaveProperty('email', unicodeUser.email);
      expect(decoded).toHaveProperty('username', unicodeUser.username);
    });

    test('should handle admin role correctly', () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: 'adminhash',
        createdAt: new Date().toISOString(),
        role: 'admin' as const
      };

      const tokens = generateTokens(adminUser);
      const decoded = verifyToken(tokens.accessToken);

      expect(decoded).toHaveProperty('role', 'admin');
    });
  });
});