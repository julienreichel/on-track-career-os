import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAllListItems } from '@/data/graphql/pagination';

vi.mock('@/data/graphql/options', () => ({
  gqlOptions: vi.fn((custom = {}) => ({
    authMode: 'userPool',
    ...custom,
  })),
}));

describe('fetchAllListItems', () => {
  let mockListFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockListFn = vi.fn();
    vi.clearAllMocks();
  });

  it('combines multiple pages until nextToken is exhausted', async () => {
    mockListFn
      .mockResolvedValueOnce({ data: ['a', 'b'], nextToken: 'next-1' })
      .mockResolvedValueOnce({ data: ['c'], nextToken: null });

    const result = await fetchAllListItems(mockListFn, { filter: { status: 'active' } });

    expect(result).toEqual(['a', 'b', 'c']);
    expect(mockListFn).toHaveBeenCalledTimes(2);
    expect(mockListFn).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ authMode: 'userPool', filter: { status: 'active' } })
    );
    expect(mockListFn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        authMode: 'userPool',
        filter: { status: 'active' },
        nextToken: 'next-1',
      })
    );
  });

  it('sends only a single request when there is no nextToken', async () => {
    mockListFn.mockResolvedValueOnce({ data: [1, 2, 3], nextToken: null });

    const result = await fetchAllListItems(mockListFn);

    expect(result).toEqual([1, 2, 3]);
    expect(mockListFn).toHaveBeenCalledTimes(1);
  });

  it('handles responses without data arrays gracefully', async () => {
    mockListFn.mockResolvedValueOnce({ data: undefined, nextToken: 'token' });
    mockListFn.mockResolvedValueOnce({ data: null, nextToken: null });

    const result = await fetchAllListItems(mockListFn, { limit: 25 });

    expect(result).toEqual([]);
    expect(mockListFn).toHaveBeenCalledTimes(2);
  });

  it('supports empty options argument', async () => {
    mockListFn.mockResolvedValueOnce({ data: [], nextToken: null });

    const result = await fetchAllListItems(mockListFn);

    expect(result).toEqual([]);
    expect(mockListFn).toHaveBeenCalledWith(expect.objectContaining({ authMode: 'userPool' }));
  });
});
