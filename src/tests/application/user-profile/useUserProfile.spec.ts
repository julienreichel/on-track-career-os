import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserProfile } from '@/application/user-profile/useUserProfile';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

// Mock the UserProfileService
vi.mock('@/domain/user-profile/UserProfileService');

describe('useUserProfile', () => {
  let mockService: ReturnType<typeof vi.mocked<UserProfileService>>;

  beforeEach(() => {
    mockService = {
      getFullUserProfile: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<UserProfileService>>;

    // Mock the constructor to return our mock service
    vi.mocked(UserProfileService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading } = useUserProfile('user-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it('should load user profile successfully', async () => {
    const mockUserProfile = {
      id: 'user-123',
      fullName: 'John Doe',
      headline: 'Software Engineer',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as UserProfile;

    mockService.getFullUserProfile.mockResolvedValue(mockUserProfile);

    const { item, loading, load } = useUserProfile('user-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockUserProfile);
    expect(mockService.getFullUserProfile).toHaveBeenCalledWith('user-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullUserProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useUserProfile('user-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when profile not found', async () => {
    mockService.getFullUserProfile.mockResolvedValue(null);

    const { item, load } = useUserProfile('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullUserProfile).toHaveBeenCalledWith('non-existent-id');
  });

  it('should propagate errors from service', async () => {
    mockService.getFullUserProfile.mockRejectedValue(new Error('Network error'));

    const { load } = useUserProfile('user-123');

    // The composable doesn't catch errors, so they should propagate
    await expect(load()).rejects.toThrow('Network error');
  });

  it('should allow multiple load calls', async () => {
    const mockProfile1 = {
      id: 'user-123',
      fullName: 'John Doe v1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as UserProfile;

    const mockProfile2 = {
      id: 'user-123',
      fullName: 'John Doe v2',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      owner: 'user-123::user-123',
    } as UserProfile;

    mockService.getFullUserProfile
      .mockResolvedValueOnce(mockProfile1)
      .mockResolvedValueOnce(mockProfile2);

    const { item, load } = useUserProfile('user-123');

    await load();
    expect(item.value).toEqual(mockProfile1);

    await load();
    expect(item.value).toEqual(mockProfile2);
    expect(mockService.getFullUserProfile).toHaveBeenCalledTimes(2);
  });

  it('should create a new service instance for each composable call', () => {
    const composable1 = useUserProfile('user-1');
    const composable2 = useUserProfile('user-2');

    expect(composable1).not.toBe(composable2);
    expect(composable1.item).not.toBe(composable2.item);
    expect(composable1.loading).not.toBe(composable2.loading);
  });

  it('should maintain reactivity on item', async () => {
    const mockUserProfile = {
      id: 'user-123',
      fullName: 'John Doe',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as UserProfile;

    mockService.getFullUserProfile.mockResolvedValue(mockUserProfile);

    const { item, load } = useUserProfile('user-123');

    await load();

    expect(item.value).toEqual(mockUserProfile);
  });

  it('should pass correct user id to service', async () => {
    const userId = 'specific-user-id-456';
    mockService.getFullUserProfile.mockResolvedValue(null);

    const { load } = useUserProfile(userId);
    await load();

    expect(mockService.getFullUserProfile).toHaveBeenCalledWith(userId);
  });
});
