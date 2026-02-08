import { describe, it, expect, vi, afterEach } from 'vitest';
import { logError, logWarn } from '@/utils/logError';

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redacts PII fields in context payloads', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test', undefined, {
      email: 'user@example.com',
      phone: '555-111',
      rawText: 'raw',
      cvText: 'cv',
      address: 'home',
      nested: { email: 'nested@example.com' },
    });

    const last = errorSpy.mock.calls.at(-1);
    expect(last?.[0]).toBe('test');
    const payload = last?.[1] as { context?: Record<string, unknown> };
    expect(payload?.context?.email).toBe('[REDACTED]');
    expect(payload?.context?.phone).toBe('[REDACTED]');
    expect(payload?.context?.rawText).toBe('[REDACTED]');
    expect(payload?.context?.cvText).toBe('[REDACTED]');
    expect(payload?.context?.address).toBe('[REDACTED]');
    expect((payload?.context?.nested as Record<string, unknown>)?.email).toBe('[REDACTED]');
  });

  it('sanitizes Error objects', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Boom');
    logError('failure', err);

    const last = errorSpy.mock.calls.at(-1);
    expect(last?.[0]).toBe('failure');
    const payload = last?.[1] as { message?: string; name?: string };
    expect(payload?.message).toBe('Boom');
    expect(payload?.name).toBe('Error');
  });
});

describe('logWarn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs warnings with sanitized context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logWarn('warning', undefined, { phone: '555-222', note: 'hello' });

    const last = warnSpy.mock.calls.at(-1);
    expect(last?.[0]).toBe('warning');
    const payload = last?.[1] as { context?: Record<string, unknown> };
    expect(payload?.context?.phone).toBe('[REDACTED]');
    expect(payload?.context?.note).toBe('hello');
  });
});
