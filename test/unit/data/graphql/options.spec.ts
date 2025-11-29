import { describe, it, expect } from 'vitest';
import { gqlOptions, GRAPHQL_OPTIONS } from '@/data/graphql/options';

describe('gqlOptions', () => {
  it('should return default options when called without arguments', () => {
    const result = gqlOptions();

    expect(result).toEqual({
      authMode: 'userPool',
    });
  });

  it('should merge custom options with default options', () => {
    const customOptions = {
      limit: 10,
      filter: { status: 'active' },
    };

    const result = gqlOptions(customOptions);

    expect(result).toEqual({
      authMode: 'userPool',
      limit: 10,
      filter: { status: 'active' },
    });
  });

  it('should override authMode when provided in custom options', () => {
    const customOptions = {
      authMode: 'apiKey',
    };

    const result = gqlOptions(customOptions);

    expect(result).toEqual({
      authMode: 'apiKey',
    });
  });

  it('should handle undefined custom options', () => {
    const result = gqlOptions(undefined);

    expect(result).toEqual({
      authMode: 'userPool',
    });
  });

  it('should handle null custom options', () => {
    const result = gqlOptions(null as unknown as Record<string, unknown>);

    expect(result).toEqual({
      authMode: 'userPool',
    });
  });

  it('should handle empty object as custom options', () => {
    const result = gqlOptions({});

    expect(result).toEqual({
      authMode: 'userPool',
    });
  });

  it('should merge nested objects in custom options', () => {
    const customOptions = {
      filter: {
        name: { contains: 'test' },
      },
      sort: {
        field: 'createdAt',
        direction: 'DESC',
      },
    };

    const result = gqlOptions(customOptions);

    expect(result).toEqual({
      authMode: 'userPool',
      filter: {
        name: { contains: 'test' },
      },
      sort: {
        field: 'createdAt',
        direction: 'DESC',
      },
    });
  });

  it('should not mutate the default options constant', () => {
    const originalAuthMode = GRAPHQL_OPTIONS.default.authMode;

    gqlOptions({ authMode: 'apiKey' });

    expect(GRAPHQL_OPTIONS.default.authMode).toBe(originalAuthMode);
    expect(GRAPHQL_OPTIONS.default.authMode).toBe('userPool');
  });

  it('should return a new object on each call', () => {
    const result1 = gqlOptions();
    const result2 = gqlOptions();

    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });
});

describe('GRAPHQL_OPTIONS', () => {
  it('should have default options with userPool authMode', () => {
    expect(GRAPHQL_OPTIONS.default).toEqual({
      authMode: 'userPool',
    });
  });

  it('should have authMode as a const type', () => {
    const authMode: 'userPool' = GRAPHQL_OPTIONS.default.authMode;
    expect(authMode).toBe('userPool');
  });
});
