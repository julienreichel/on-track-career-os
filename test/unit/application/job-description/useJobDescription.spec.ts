import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJobDescription } from '@/application/job-description/useJobDescription';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescription } from '@/domain/job-description/JobDescription';

// Mock the JobDescriptionService
vi.mock('@/domain/job-description/JobDescriptionService');

describe('useJobDescription', () => {
  let mockService: ReturnType<typeof vi.mocked<JobDescriptionService>>;

  beforeEach(() => {
    mockService = {
      getFullJobDescription: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<JobDescriptionService>>;

    // Mock the constructor to return our mock service
    vi.mocked(JobDescriptionService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useJobDescription('jobdescription-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load JobDescription successfully', async () => {
    const mockJobDescription = {
      id: 'jobdescription-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as JobDescription;

    mockService.getFullJobDescription.mockResolvedValue(mockJobDescription);

    const { item, loading, load } = useJobDescription('jobdescription-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockJobDescription);
    expect(mockService.getFullJobDescription).toHaveBeenCalledWith('jobdescription-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullJobDescription.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useJobDescription('jobdescription-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when JobDescription not found', async () => {
    mockService.getFullJobDescription.mockResolvedValue(null);

    const { item, load } = useJobDescription('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullJobDescription).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullJobDescription.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useJobDescription('jobdescription-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  // TODO: Add more tests for error handling and edge cases
});
