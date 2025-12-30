import { describe, it, expect } from 'vitest';
import { applyArrayNormalization, normalizeStringArray } from '@/domain/company/companyUtils';

describe('companyUtils', () => {
  describe('normalizeStringArray', () => {
    it('removes empty values and trims entries', () => {
      expect(
        normalizeStringArray(['  Alpha  ', '', 'Beta', 'alpha', null as unknown as string])
      ).toEqual(['Alpha', 'Beta']);
    });

    it('returns empty array when input falsy', () => {
      expect(normalizeStringArray(undefined)).toEqual([]);
    });
  });

  describe('applyArrayNormalization', () => {
    it('normalizes only provided keys', () => {
      const payload = {
        name: 'Test',
        tags: [' Foo ', 'Bar', 'foo'],
        notes: [' keep '],
      };
      expect(applyArrayNormalization(payload, ['tags'])).toEqual({
        name: 'Test',
        tags: ['Foo', 'Bar'],
        notes: [' keep '],
      });
    });
  });
});
