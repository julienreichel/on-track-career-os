import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadLazy } from '@/data/graphql/lazy';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: vi.fn(() => ({
    authMode: 'userPool',
  })),
}));

describe('loadLazy', () => {
  let mockRelationFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRelationFn = vi.fn();
    vi.clearAllMocks();
  });

  it('should call the relation function with default empty args and gqlOptions', async () => {
    const mockData = { id: '1', name: 'Test' };
    mockRelationFn.mockResolvedValue(mockData);

    const result = await loadLazy(mockRelationFn);

    expect(mockRelationFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(result).toEqual(mockData);
  });

  it('should pass custom args to the relation function', async () => {
    const mockData = [{ id: '1' }, { id: '2' }];
    const customArgs = { limit: 10, filter: { status: 'active' } };
    mockRelationFn.mockResolvedValue(mockData);

    const result = await loadLazy(mockRelationFn, customArgs);

    expect(mockRelationFn).toHaveBeenCalledWith(
      customArgs,
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(result).toEqual(mockData);
  });

  it('should handle undefined args as empty object', async () => {
    const mockData = { data: 'test' };
    mockRelationFn.mockResolvedValue(mockData);

    const result = await loadLazy(mockRelationFn, undefined);

    expect(mockRelationFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(result).toEqual(mockData);
  });

  it('should handle relation function returning null', async () => {
    mockRelationFn.mockResolvedValue(null);

    const result = await loadLazy(mockRelationFn);

    expect(result).toBeNull();
  });

  it('should handle relation function returning undefined', async () => {
    mockRelationFn.mockResolvedValue(undefined);

    const result = await loadLazy(mockRelationFn);

    expect(result).toBeUndefined();
  });

  it('should handle relation function returning array', async () => {
    const mockArray = [1, 2, 3, 4, 5];
    mockRelationFn.mockResolvedValue(mockArray);

    const result = await loadLazy(mockRelationFn, { limit: 5 });

    expect(result).toEqual(mockArray);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should propagate errors from relation function', async () => {
    const error = new Error('Failed to load relation');
    mockRelationFn.mockRejectedValue(error);

    await expect(loadLazy(mockRelationFn)).rejects.toThrow('Failed to load relation');
  });

  it('should handle complex nested data structures', async () => {
    const complexData = {
      user: {
        id: '123',
        profile: {
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        posts: [{ id: 'p1' }, { id: 'p2' }],
      },
    };
    mockRelationFn.mockResolvedValue(complexData);

    const result = await loadLazy(mockRelationFn);

    expect(result).toEqual(complexData);
  });

  it('should be called only once per invocation', async () => {
    mockRelationFn.mockResolvedValue({ data: 'test' });

    await loadLazy(mockRelationFn);

    expect(mockRelationFn).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple sequential calls independently', async () => {
    const mockData1 = { id: '1' };
    const mockData2 = { id: '2' };
    mockRelationFn
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const result1 = await loadLazy(mockRelationFn, { id: '1' });
    const result2 = await loadLazy(mockRelationFn, { id: '2' });

    expect(result1).toEqual(mockData1);
    expect(result2).toEqual(mockData2);
    expect(mockRelationFn).toHaveBeenCalledTimes(2);
  });

  it('should handle empty object as args', async () => {
    const mockData = { test: 'data' };
    mockRelationFn.mockResolvedValue(mockData);

    const result = await loadLazy(mockRelationFn, {});

    expect(mockRelationFn).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ authMode: 'userPool' })
    );
    expect(result).toEqual(mockData);
  });

  it('should work with different data types', async () => {
    // Test with string
    mockRelationFn.mockResolvedValueOnce('string result');
    let result = await loadLazy(mockRelationFn);
    expect(result).toBe('string result');

    // Test with number
    mockRelationFn.mockResolvedValueOnce(42);
    result = await loadLazy(mockRelationFn);
    expect(result).toBe(42);

    // Test with boolean
    mockRelationFn.mockResolvedValueOnce(true);
    result = await loadLazy(mockRelationFn);
    expect(result).toBe(true);
  });
});
