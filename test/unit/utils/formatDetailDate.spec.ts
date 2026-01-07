import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDetailDate } from '@/utils/formatDetailDate';

describe('formatDetailDate', () => {
  const originalDateTimeFormat = Intl.DateTimeFormat;

  afterEach(() => {
    Intl.DateTimeFormat = originalDateTimeFormat;
    vi.restoreAllMocks();
  });

  it('returns empty string for missing value', () => {
    expect(formatDetailDate()).toBe('');
  });

  it('returns original value when formatting fails', () => {
    expect(formatDetailDate('not-a-date')).toBe('not-a-date');
  });

  it('formats valid date with the expected options', () => {
    const formatMock = vi.fn().mockReturnValue('Formatted date');
    const dateTimeFormatMock = vi.fn().mockImplementation(() => ({
      format: formatMock,
    }));

    Intl.DateTimeFormat = dateTimeFormatMock as unknown as typeof Intl.DateTimeFormat;

    const value = formatDetailDate('2024-01-02T03:04:05.000Z');
    expect(value).toBe('Formatted date');
    expect(dateTimeFormatMock).toHaveBeenCalledWith(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  });
});
