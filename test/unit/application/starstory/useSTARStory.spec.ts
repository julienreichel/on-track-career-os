import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSTARStory } from '@/application/starstory/useSTARStory';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

// Mock the STARStoryService
vi.mock('@/domain/starstory/STARStoryService');

describe('useSTARStory', () => {
  let mockService: ReturnType<typeof vi.mocked<STARStoryService>>;

  beforeEach(() => {
    mockService = {
      getFullSTARStory: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<STARStoryService>>;

    // Mock the constructor to return our mock service
    vi.mocked(STARStoryService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = useSTARStory('starstory-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load STARStory successfully', async () => {
    const mockSTARStory = {
      id: 'starstory-123',
      situation: 'Team facing deployment challenges',
      task: 'Streamline deployment process',
      action: 'Implemented CI/CD pipeline',
      result: 'Reduced deployment time by 60%',
      achievements: ['Implemented automated testing', 'Improved deployment speed'],
      kpiSuggestions: ['Deployment frequency increased', 'Error rate decreased'],
      experienceId: 'exp-456',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as STARStory;

    mockService.getFullSTARStory.mockResolvedValue(mockSTARStory);

    const { item, loading, load } = useSTARStory('starstory-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockSTARStory);
    expect(mockService.getFullSTARStory).toHaveBeenCalledWith('starstory-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullSTARStory.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useSTARStory('starstory-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when STARStory not found', async () => {
    mockService.getFullSTARStory.mockResolvedValue(null);

    const { item, load } = useSTARStory('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullSTARStory).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullSTARStory.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = useSTARStory('starstory-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  it('should handle unknown errors', async () => {
    mockService.getFullSTARStory.mockRejectedValue('Unknown error');

    const { error, load } = useSTARStory('starstory-123');

    await load();

    expect(error.value).toBe('Unknown error occurred');
  });

  it('should reset error state on successful reload', async () => {
    const mockSTARStory = {
      id: 'starstory-123',
      situation: 'Test situation',
      task: 'Test task',
      action: 'Test action',
      result: 'Test result',
      achievements: [],
      kpiSuggestions: [],
      experienceId: 'exp-456',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123',
    } as STARStory;

    // First call fails
    mockService.getFullSTARStory.mockRejectedValueOnce(new Error('Network error'));
    const { error, load } = useSTARStory('starstory-123');

    await load();
    expect(error.value).toBe('Network error');

    // Second call succeeds
    mockService.getFullSTARStory.mockResolvedValue(mockSTARStory);
    await load();

    expect(error.value).toBeNull();
  });
});
