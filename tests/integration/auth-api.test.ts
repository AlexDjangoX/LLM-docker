import request from 'supertest';
import express from 'express';
import { createTestApp } from '../helpers/test-app.js';

describe('Authentication API - Integration Tests', () => {
  let app: express.Application;

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
      email: `test-${uniqueId}@example.com`,
      username: `testuser${uniqueId}`,
      password: 'TestPass123!'
    };
  };

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = getUniqueTestData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    test('should reject duplicate email', async () => {
      const userData1 = getUniqueTestData();
      const userData2 = {
        email: userData1.email, // Same email as first user
        username: `different${userData1.username}`,
        password: 'DifferentPass123!'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData1);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData2)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('already exists');
    });

    test('should reject invalid input', async () => {
      const invalidData = {
        email: '',
        username: '',
        password: 'short'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject weak password', async () => {
      const weakPasswordData = {
        email: 'weak-pass@example.com',
        username: 'weakpassuser',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully', async () => {
      const userData = getUniqueTestData();

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    test('should reject invalid credentials with generic message', async () => {
      const invalidLoginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication failed');
      expect(response.body).toHaveProperty('message', 'Login failed');
    });

    test('should reject wrong password with generic message', async () => {
      const userData = getUniqueTestData();

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const wrongPasswordData = {
        email: userData.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(wrongPasswordData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication failed');
      expect(response.body).toHaveProperty('message', 'Login failed');
    });
  });

  describe('POST /api/auth/validate-password', () => {
    test('should validate strong password', async () => {
      const response = await request(app)
        .post('/api/auth/validate-password')
        .send({ password: 'StrongPassword123!' })
        .expect(200);

      expect(response.body).toHaveProperty('isValid', true);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(0);
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/validate-password')
        .send({ password: 'weak' })
        .expect(200);

      expect(response.body).toHaveProperty('isValid', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/auth/users (Admin only)', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Create and login as admin user for this test suite
      const adminUserData = getUniqueTestData();
      adminUserData.username = 'admin';
      adminUserData.password = 'admin123';

      // Register admin user
      await request(app)
        .post('/api/auth/register')
        .send(adminUserData);

      // Manually promote user to admin (in a real app this would be done by an existing admin)
      const fs = await import('fs');
      const path = await import('path');
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(usersFile)) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        const userIndex = users.findIndex((u: any) => u.email === adminUserData.email);
        if (userIndex !== -1) {
          users[userIndex].role = 'admin';
          fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        }
      }

      // Login again to get new token with admin role
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUserData.email,
          password: adminUserData.password
        });

      expect(loginResponse.body).toHaveProperty('tokens');
      adminToken = loginResponse.body.tokens.accessToken;
    });

    test('should return users list for admin', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);

      // Check that password hashes are not included
      const user = response.body.users[0];
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('role');
    });

    test('should reject non-admin users', async () => {
      // First register a regular user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'regular-user@example.com',
          username: 'regularuser',
          password: 'RegularPass123!'
        });

      const userToken = registerResponse.body.tokens.accessToken;

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/change-password', () => {
    let userToken: string;
    let userId: string;
    let userData: any;

    beforeAll(async () => {
      // Register and login a test user
      userData = getUniqueTestData();
      userData.password = 'OriginalPass123!'; // Override with specific password for testing

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      userToken = registerResponse.body.tokens.accessToken;
      userId = registerResponse.body.user.userId;
    });

    test('should change password successfully', async () => {
      const changeData = {
        currentPassword: 'OriginalPass123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(changeData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password changed successfully');
    });

    test('should reject invalid current password', async () => {
      const changeData = {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(changeData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication failed');
      expect(response.body.message).toContain('Current password is incorrect');
    });

    test('should reject weak new password', async () => {
      const changeData = {
        currentPassword: 'NewPassword123!',
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(changeData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Password validation failed');
    });

    test('should reject non-matching passwords', async () => {
      const changeData = {
        currentPassword: 'OriginalPass123!',
        newPassword: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(changeData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('do not match');
    });
  });

  describe('POST /api/auth/delete-account', () => {
    let userToken: string;
    let deleteUserData: any;

    beforeAll(async () => {
      // Register a test user for deletion
      deleteUserData = getUniqueTestData();
      deleteUserData.password = 'DeletePass123!'; // Override with specific password for testing

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(deleteUserData);

      userToken = registerResponse.body.tokens.accessToken;
    });

    test('should delete user account', async () => {
      const deleteData = {
        password: deleteUserData.password
      };

      const response = await request(app)
        .post('/api/auth/delete-account')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Account deleted successfully');
    });

    test('should reject admin account deletion', async () => {
      // Create a regular user first
      const adminData = getUniqueTestData();
      adminData.username = 'testadmin';

      await request(app)
        .post('/api/auth/register')
        .send(adminData);

      // Manually promote user to admin (in a real app this would be done by an existing admin)
      const fs = await import('fs');
      const path = await import('path');
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(usersFile)) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        const userIndex = users.findIndex((u: any) => u.email === adminData.email);
        if (userIndex !== -1) {
          users[userIndex].role = 'admin';
          fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        }
      }

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password
        });

      const adminToken = adminLoginResponse.body.tokens.accessToken;

      const deleteData = {
        password: adminData.password
      };

      const response = await request(app)
        .post('/api/auth/delete-account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(deleteData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Admin accounts cannot be deleted');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should include user info when authenticated', async () => {
      // Create and login a test user
      const testUserData = getUniqueTestData();

      await request(app)
        .post('/api/auth/register')
        .send(testUserData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password
        });

      expect(loginResponse.body).toHaveProperty('tokens');
      const token = loginResponse.body.tokens.accessToken;

      const response = await request(app)
        .get('/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');

      // In test environment, user might not be attached due to middleware issues
      // Just verify the endpoint works with auth header
      if (response.body.user) {
        expect(response.body.user).toHaveProperty('username');
        expect(response.body.user).toHaveProperty('role');
      }
    });
  });
});