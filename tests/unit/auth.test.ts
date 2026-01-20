import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import {
  registerUser,
  loginUser,
  validatePasswordStrength,
  changeUserPassword,
  deleteUserAccount,
  getUserById,
  getAllUsers,
  initializeDefaultAdmin,
  User
} from '../../src/services/auth.js';

// Mock file system operations
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Authentication Service - Unit Tests', () => {
  const testUsersFile = path.join(process.cwd(), 'data', 'users.json');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock fs.existsSync for data directory
    mockFs.existsSync.mockReturnValue(true);

    // Mock empty users file initially
    mockFs.readFileSync.mockReturnValue('[]');

    // Mock write operations
    mockFs.writeFileSync.mockImplementation(() => {});
  });

  describe('Password Validation', () => {
    test('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should require minimum length', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should require uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should require lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should require number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should require special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should contain at least one special character');
    });
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!'
      };

      const result = await registerUser(userData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Verify user was saved
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].email).toBe('test@example.com');
      expect(savedData[0].username).toBe('testuser');
    });

    test('should reject duplicate email', async () => {
      // Mock existing user
      const existingUsers = [{
        id: '1',
        email: 'test@example.com',
        username: 'existinguser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingUsers));

      const userData = {
        email: 'test@example.com',
        username: 'newuser',
        password: 'TestPass123!'
      };

      await expect(registerUser(userData)).rejects.toThrow('User with this email or username already exists');
    });

    test('should reject duplicate username', async () => {
      // Mock existing user
      const existingUsers = [{
        id: '1',
        email: 'existing@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingUsers));

      const userData = {
        email: 'new@example.com',
        username: 'testuser',
        password: 'TestPass123!'
      };

      await expect(registerUser(userData)).rejects.toThrow('User with this email or username already exists');
    });

    test('should require all fields', async () => {
      const userData = {
        email: '',
        username: '',
        password: ''
      };

      await expect(registerUser(userData)).rejects.toThrow('Email, username, and password are required');
    });

    test('should reject short password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'short'
      };

      await expect(registerUser(userData)).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('User Login', () => {
    test('should login successfully with correct credentials', async () => {
      const hashedPassword = '$2b$12$kj6R3qIQfeix9fYPjmhLiOEktYlIJMoAIOSJwUjT/1CaRKoGiFg1m'; // bcrypt hash for 'TestPass123!'

      const existingUsers = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingUsers));

      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const result = await loginUser(loginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    test('should reject invalid email', async () => {
      mockFs.readFileSync.mockReturnValue('[]');

      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      };

      await expect(loginUser(loginData)).rejects.toThrow('Login failed');
    });

    test('should reject invalid password', async () => {
      const existingUsers = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: '$2b$12$wrong.hash.for.testing.purposes',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingUsers));

      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      await expect(loginUser(loginData)).rejects.toThrow('Login failed');
    });

    test('should update last login on successful login', async () => {
      const hashedPassword = '$2b$12$kj6R3qIQfeix9fYPjmhLiOEktYlIJMoAIOSJwUjT/1CaRKoGiFg1m';

      const existingUsers = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingUsers));

      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      await loginUser(loginData);

      // Verify lastLogin was updated
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(savedData[0]).toHaveProperty('lastLogin');
    });
  });

  describe('User Management', () => {
    test('should get user by ID', () => {
      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      const user = getUserById('1');
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    test('should return null for non-existent user', () => {
      mockFs.readFileSync.mockReturnValue('[]');

      const user = getUserById('nonexistent');
      expect(user).toBeNull();
    });

    test('should get all users without password hashes', () => {
      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'secret-hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const,
        lastLogin: new Date().toISOString()
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      const allUsers = getAllUsers();
      expect(allUsers).toHaveLength(1);
      expect(allUsers[0]).not.toHaveProperty('passwordHash');
      expect(allUsers[0]).toHaveProperty('email');
      expect(allUsers[0]).toHaveProperty('username');
    });
  });

  describe('Password Change', () => {
    test('should change password successfully', async () => {
      const hashedPassword = '$2b$12$kj6R3qIQfeix9fYPjmhLiOEktYlIJMoAIOSJwUjT/1CaRKoGiFg1m';

      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await changeUserPassword('1', 'TestPass123!', 'NewPass123!', 'NewPass123!');

      // Verify password was updated
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(savedData[0].passwordHash).not.toBe(hashedPassword);
    });

    test('should reject invalid current password', async () => {
      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await expect(
        changeUserPassword('1', 'WrongPassword!', 'NewPass123!', 'NewPass123!')
      ).rejects.toThrow('Current password is incorrect');
    });

    test('should reject weak new password', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkQyqMZ5JNwW';

      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await expect(
        changeUserPassword('1', 'TestPass123!', 'weak', 'weak')
      ).rejects.toThrow('Password validation failed');
    });

    test('should reject non-matching passwords', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkQyqMZ5JNwW';

      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await expect(
        changeUserPassword('1', 'TestPass123!', 'NewPass123!', 'DifferentPass123!')
      ).rejects.toThrow('New password and confirmation do not match');
    });
  });

  describe('Account Deletion', () => {
    test('should delete user account', async () => {
      const hashedPassword = '$2b$12$kj6R3qIQfeix9fYPjmhLiOEktYlIJMoAIOSJwUjT/1CaRKoGiFg1m';

      const users = [
        {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: hashedPassword,
          createdAt: new Date().toISOString(),
          role: 'user' as const
        },
        {
          id: '2',
          email: 'other@example.com',
          username: 'otheruser',
          passwordHash: 'hash2',
          createdAt: new Date().toISOString(),
          role: 'user' as const
        }
      ];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await deleteUserAccount('1', 'TestPass123!');

      // Verify user was removed
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('2');
    });

    test('should prevent admin deletion', async () => {
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkQyqMZ5JNwW';

      const users = [{
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'admin' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await expect(deleteUserAccount('1', 'TestPass123!')).rejects.toThrow('Admin accounts cannot be deleted');
    });

    test('should reject invalid password for deletion', async () => {
      const users = [{
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        createdAt: new Date().toISOString(),
        role: 'user' as const
      }];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(users));

      await expect(deleteUserAccount('1', 'WrongPassword!')).rejects.toThrow('Password is incorrect');
    });
  });
});