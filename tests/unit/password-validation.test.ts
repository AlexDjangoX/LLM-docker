import { validatePasswordStrength } from '../../src/services/auth.js';

describe('Password Strength Validation - Unit Tests', () => {
  describe('Valid passwords', () => {
    test('should accept strong password with all requirements', () => {
      const result = validatePasswordStrength('MySecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept password with minimum requirements', () => {
      const result = validatePasswordStrength('Password1!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept moderately long passwords', () => {
      const longPassword = 'A'.repeat(49) + 'a1!'; // 52 characters, has upper, lower, number, special
      const result = validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(true);
    });

    test('should accept passwords with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
      specialChars.forEach(char => {
        const password = `Password1${char}`;
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });

    test('should accept passwords with unicode characters', () => {
      const result = validatePasswordStrength('Pässword123!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid passwords - length', () => {
    test('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject very long passwords', () => {
      const tooLongPassword = 'A'.repeat(129); // 129 characters
      const result = validatePasswordStrength(tooLongPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    test('should reject passwords at exactly 128 characters', () => {
      const exactly128Chars = 'A'.repeat(128);
      const result = validatePasswordStrength(exactly128Chars);
      expect(result.isValid).toBe(false);
      // Should fail due to missing requirements, but length is okay
      expect(result.errors).not.toContain('Password must be less than 128 characters');
    });
  });

  describe('Invalid passwords - uppercase', () => {
    test('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should accept passwords with only one uppercase letter', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.isValid).toBe(true);
    });

    test('should accept passwords with uppercase anywhere', () => {
      const result = validatePasswordStrength('passworD123!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid passwords - lowercase', () => {
    test('should reject passwords without lowercase letters', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should accept passwords with only one lowercase letter', () => {
      const result = validatePasswordStrength('PassworD123!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid passwords - numbers', () => {
    test('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should accept passwords with single digit', () => {
      const result = validatePasswordStrength('Password1!');
      expect(result.isValid).toBe(true);
    });

    test('should accept passwords with multiple digits', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.isValid).toBe(true);
    });

    test('should accept passwords with digits anywhere', () => {
      const result = validatePasswordStrength('Pass1word!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid passwords - special characters', () => {
    test('should reject passwords without special characters', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should contain at least one special character');
    });

    test('should accept passwords with one special character', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.isValid).toBe(true);
    });

    test('should accept various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", ',', '.', '<', '>', '/', '?'];

      specialChars.forEach(char => {
        const password = `Password123${char}`;
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject passwords with only common special chars', () => {
      // Test edge case - what if someone uses only spaces or tabs?
      const result = validatePasswordStrength('Password123 ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should contain at least one special character');
    });
  });

  describe('Multiple validation errors', () => {
    test('should report all validation errors', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password should contain at least one special character');
    });

    test('should handle passwords that fail multiple requirements', () => {
      const result = validatePasswordStrength('ABCDEF');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(4); // Missing lowercase, number, special char, and length
    });
  });

  describe('Edge cases', () => {
    test('should handle passwords with only special characters', () => {
      const result = validatePasswordStrength('!!!!!!!!!!');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3); // Missing uppercase, lowercase, number
    });

    test('should handle passwords with only numbers', () => {
      const result = validatePasswordStrength('1234567890');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3); // Missing uppercase, lowercase, special char
    });

    test('should handle passwords with only letters', () => {
      const result = validatePasswordStrength('Password');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2); // Missing number, special char
    });

    test('should handle passwords with mixed case but no numbers or special chars', () => {
      const result = validatePasswordStrength('Password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password should contain at least one special character');
    });

    test('should handle passwords that meet all criteria except length', () => {
      const result = validatePasswordStrength('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).not.toContain('Password must contain at least one uppercase letter');
      expect(result.errors).not.toContain('Password must contain at least one lowercase letter');
      expect(result.errors).not.toContain('Password must contain at least one number');
      expect(result.errors).not.toContain('Password should contain at least one special character');
    });
  });

  describe('Security considerations', () => {
    test('should validate various password patterns', () => {
      const testPasswords = [
        { password: 'password123!', expectedErrors: 1 }, // Missing uppercase
        { password: 'Password123', expectedErrors: 1 },  // Missing special char
        { password: '12345678!', expectedErrors: 2 },    // Missing uppercase and lowercase
        { password: 'qwerty123!', expectedErrors: 1 }    // Missing uppercase
      ];

      testPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePasswordStrength(password);
        expect(result.errors.length).toBe(expectedErrors);
      });
    });

    test('should handle password entropy considerations', () => {
      // Test various password patterns
      const testCases = [
        { password: 'AAAAAAAAa1!', description: 'Repeated characters' }, // Valid but low entropy
        { password: '123456789Aa!', description: 'Sequential numbers' },  // Valid but predictable
        { password: 'ABCDEFGHIa1!', description: 'Sequential letters' }   // Valid but predictable
      ];

      testCases.forEach(({ password, description }) => {
        const result = validatePasswordStrength(password);
        // These pass basic validation but have low entropy
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });
  });

  describe('Return format', () => {
    test('should return consistent format', () => {
      const result = validatePasswordStrength('Test123!');

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.every(error => typeof error === 'string')).toBe(true);
    });

    test('should return empty errors array for valid passwords', () => {
      const result = validatePasswordStrength('ValidPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should return non-empty errors array for invalid passwords', () => {
      const result = validatePasswordStrength('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});