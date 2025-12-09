import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuthUser } from '@/composables/useAuthUser';

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: vi.fn(),
}));

// Mock vue's onMounted to call immediately
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    onMounted: (callback: () => void) => callback(),
  };
});

describe('useAuthUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null userId', () => {
    vi.mocked(fetchUserAttributes).mockResolvedValue({ sub: 'user-123' } as never);

    const { userId, error } = useAuthUser();

    expect(userId.value).toBeNull();
    expect(error.value).toBeNull();
    // Note: loading starts true because onMounted triggers loadUserId automatically
  });

  it('should load user ID on mount', async () => {
    const mockAttributes = { sub: 'user-123' };
    vi.mocked(fetchUserAttributes).mockResolvedValue(mockAttributes as never);

    const { userId, loading } = useAuthUser();

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchUserAttributes).toHaveBeenCalled();
    expect(userId.value).toBe('user-123');
    expect(loading.value).toBe(false);
  });

  it('should handle missing sub attribute', async () => {
    const mockAttributes = { email: 'test@example.com' };
    vi.mocked(fetchUserAttributes).mockResolvedValue(mockAttributes as never);

    const { userId } = useAuthUser();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(userId.value).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Auth error');
    vi.mocked(fetchUserAttributes).mockRejectedValue(mockError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { userId, error, loading } = useAuthUser();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(userId.value).toBeNull();
    expect(error.value).toBe('Failed to load user information');
    expect(loading.value).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch user attributes:', mockError);

    consoleErrorSpy.mockRestore();
  });

  it('should set loading state during fetch', async () => {
    let resolvePromise: (value: never) => void;
    const promise = new Promise<never>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(fetchUserAttributes).mockReturnValue(promise);

    const { loading } = useAuthUser();

    // Should be loading immediately
    expect(loading.value).toBe(true);

    // Resolve the promise
    resolvePromise!({ sub: 'user-123' } as never);
    await promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(loading.value).toBe(false);
  });

  it('should allow manual reload with loadUserId', async () => {
    vi.mocked(fetchUserAttributes)
      .mockResolvedValueOnce({ sub: 'user-123' } as never)
      .mockResolvedValueOnce({ sub: 'user-456' } as never);

    const { userId, loadUserId } = useAuthUser();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(userId.value).toBe('user-123');

    // Manual reload
    await loadUserId();
    expect(userId.value).toBe('user-456');
    expect(fetchUserAttributes).toHaveBeenCalledTimes(2);
  });

  it('should clear error on successful reload', async () => {
    vi.mocked(fetchUserAttributes)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ sub: 'user-123' } as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { error, loadUserId } = useAuthUser();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(error.value).toBe('Failed to load user information');

    // Reload successfully
    await loadUserId();
    expect(error.value).toBeNull();
  });
});
