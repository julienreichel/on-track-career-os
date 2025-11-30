import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExperience } from '@/application/experience/useExperience';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { Experience } from '@/domain/experience/Experience';

// Mock the ExperienceService
vi.mock('@/domain/experience/ExperienceService');

describe('useExperience', () => {
  let mockService: ReturnType<typeof vi.mocked<ExperienceService>>;

  beforeEach(() => {
    mockService = {
      getFullExperience: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<ExperienceService>>;

    // Mock the constructor to return our mock service
    vi.mocked(ExperienceService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading } = useExperience('experience-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it('should load Experience successfully', async () => {
    const mockExperience = {
      id: 'experience-123',
      title: 'Senior Software Engineer',
      companyName: 'TechCorp Inc.',
      startDate: '2020-01-15',
      endDate: '2023-12-31',
      responsibilities: ['Lead development team', 'Architecture design'],
      tasks: ['Code review', 'Sprint planning'],
      status: 'complete',
      userId: 'user-123',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as Experience;

    mockService.getFullExperience.mockResolvedValue(mockExperience);

    const { item, loading, load } = useExperience('experience-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockExperience);
    expect(mockService.getFullExperience).toHaveBeenCalledWith('experience-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullExperience.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = useExperience('experience-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when Experience not found', async () => {
    mockService.getFullExperience.mockResolvedValue(null);

    const { item, load } = useExperience('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullExperience).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle service errors gracefully', async () => {
    mockService.getFullExperience.mockRejectedValue(new Error('Service error'));

    const { item, loading, load } = useExperience('experience-123');

    // Error propagates from service, loading remains true until finally block
    await expect(load()).rejects.toThrow('Service error');

    // Loading is set to false in finally block even on error
    expect(loading.value).toBe(false);
    // Item remains null since service threw error before setting value
    expect(item.value).toBeNull();
  });

  it('should handle experiences with null endDate (current position)', async () => {
    const currentExperience = {
      id: 'experience-current',
      title: 'Lead Engineer',
      companyName: 'Current Company',
      startDate: '2023-01-01',
      endDate: null, // Current position
      responsibilities: ['Team leadership'],
      status: 'complete',
      userId: 'user-123',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as Experience;

    mockService.getFullExperience.mockResolvedValue(currentExperience);

    const { item, load } = useExperience('experience-current');

    await load();

    expect(item.value).toEqual(currentExperience);
    expect(item.value?.endDate).toBeNull();
  });
});
