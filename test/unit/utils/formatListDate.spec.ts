import { describe, it, expect } from 'vitest';
import { formatListDate } from '@/utils/formatListDate';

describe('formatListDate', () => {
  it('formats a valid ISO date', () => {
    const result = formatListDate('2025-12-30T10:00:00.000Z');
    expect(result).toBe('Dec 30, 2025');
  });

  it('returns empty string for invalid input', () => {
    expect(formatListDate('not-a-date')).toBe('');
    expect(formatListDate(undefined)).toBe('');
    expect(formatListDate(null)).toBe('');
  });
});
