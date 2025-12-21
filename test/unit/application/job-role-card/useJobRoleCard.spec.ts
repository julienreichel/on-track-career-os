import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJobRoleCard } from '@/application/job-role-card/useJobRoleCard';
import { JobRoleCardService } from '@/domain/job-role-card/JobRoleCardService';
import type { JobRoleCard } from '@/domain/job-role-card/JobRoleCard';

// Mock the JobRoleCardService
vi.mock('@/domain/job-role-card/JobRoleCardService');

describe('useJobRoleCard', () => {
  let mockService: ReturnType<typeof vi.mocked<JobRoleCardService>>;

  beforeEach(() => {
    mockService = {
      getFullJobRoleCard: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<JobRoleCardService>>;

    // Mock the constructor to return our mock service
    vi.mocked(JobRoleCardService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useJobRoleCard('jobrolecard-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load JobRoleCard successfully', async () => {
    const mockJobRoleCard = {
      id: 'jobrolecard-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as JobRoleCard;

    mockService.getFullJobRoleCard.mockResolvedValue(mockJobRoleCard);

    const { item, loading, load } = useJobRoleCard('jobrolecard-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockJobRoleCard);
    expect(mockService.getFullJobRoleCard).toHaveBeenCalledWith('jobrolecard-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullJobRoleCard.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useJobRoleCard('jobrolecard-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when JobRoleCard not found', async () => {
    mockService.getFullJobRoleCard.mockResolvedValue(null);

    const { item, load } = useJobRoleCard('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullJobRoleCard).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullJobRoleCard.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useJobRoleCard('jobrolecard-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  // TODO: Add more tests for error handling and edge cases
});
