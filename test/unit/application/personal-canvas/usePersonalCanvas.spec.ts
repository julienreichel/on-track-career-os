import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePersonalCanvas } from '@/application/personal-canvas/usePersonalCanvas';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';

// Mock the PersonalCanvasService
vi.mock('@/domain/personal-canvas/PersonalCanvasService');

describe('usePersonalCanvas', () => {
  let mockService: ReturnType<typeof vi.mocked<PersonalCanvasService>>;

  beforeEach(() => {
    mockService = {
      getFullPersonalCanvas: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasService>>;

    // Mock the constructor to return our mock service
    vi.mocked(PersonalCanvasService).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading, error } = usePersonalCanvas('personalcanvas-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should load PersonalCanvas successfully', async () => {
    const mockPersonalCanvas = {
      id: 'personalcanvas-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    mockService.getFullPersonalCanvas.mockResolvedValue(mockPersonalCanvas);

    const { item, loading, load } = usePersonalCanvas('personalcanvas-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mockPersonalCanvas);
    expect(mockService.getFullPersonalCanvas).toHaveBeenCalledWith('personalcanvas-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFullPersonalCanvas.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = usePersonalCanvas('personalcanvas-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when PersonalCanvas not found', async () => {
    mockService.getFullPersonalCanvas.mockResolvedValue(null);

    const { item, load } = usePersonalCanvas('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFullPersonalCanvas).toHaveBeenCalledWith('non-existent-id');
  });

  it('should handle errors and set error state', async () => {
    mockService.getFullPersonalCanvas.mockRejectedValue(new Error('Service failed'));

    const { item, loading, error, load } = usePersonalCanvas('personalcanvas-123');

    await load();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Service failed');
    expect(item.value).toBeNull();
  });

  // TODO: Add more tests for error handling and edge cases
});
