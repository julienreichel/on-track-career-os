import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPhone, isValidUrl } from '@/domain/user-profile/contactValidation';

describe('contactValidation', () => {
  describe('isValidEmail', () => {
    it('validates proper emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('USER+alias@example.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('accepts international numbers', () => {
      expect(isValidPhone('+1 650 555 0101')).toBe(true);
      expect(isValidPhone('(415) 555-1212')).toBe(true);
    });

    it('rejects invalid phone formats', () => {
      expect(isValidPhone('abc-defg')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('accepts standard URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/profile')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://')).toBe(false);
    });
  });
});
