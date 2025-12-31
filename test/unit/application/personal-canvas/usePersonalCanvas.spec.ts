import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePersonalCanvas } from '@/application/personal-canvas/usePersonalCanvas';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import { withMockedConsoleError } from '../../../utils/withMockedConsole';

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
      userId: 'user-123',
      valueProposition: 'Experienced software engineer',
      keyActivities: ['Development', 'Mentoring'],
      strengthsAdvantage: 'Technical leadership',
      targetRoles: ['Senior Engineer', 'Tech Lead'],
      channels: ['LinkedIn', 'GitHub'],
      resources: ['AWS Certification', 'Portfolio'],
      careerDirection: 'Technical leadership',
      painRelievers: ['Process improvement'],
      gainCreators: ['Team productivity'],
      lastGeneratedAt: '2025-01-15T00:00:00Z',
      needsUpdate: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
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

  it(
    'should handle errors and set error state',
    withMockedConsoleError(async () => {
      mockService.getFullPersonalCanvas.mockRejectedValue(new Error('Service failed'));

      const { item, loading, error, load } = usePersonalCanvas('personalcanvas-123');

      await load();

      expect(loading.value).toBe(false);
      expect(error.value).toBe('Service failed');
      expect(item.value).toBeNull();
    })
  );

  it(
    'should handle network errors',
    withMockedConsoleError(async () => {
      mockService.getFullPersonalCanvas.mockRejectedValue(new Error('Network error'));

      const { loading, error, item, load } = usePersonalCanvas('personalcanvas-123');

      await load();

      expect(loading.value).toBe(false);
      expect(error.value).toBe('Network error');
      expect(item.value).toBeNull();
    })
  );

  it('should allow multiple load calls', async () => {
    const mockCanvas1 = {
      id: 'personalcanvas-123',
      userId: 'user-123',
      valueProposition: 'Version 1',
      needsUpdate: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    const mockCanvas2 = {
      id: 'personalcanvas-123',
      userId: 'user-123',
      valueProposition: 'Version 2',
      needsUpdate: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    mockService.getFullPersonalCanvas
      .mockResolvedValueOnce(mockCanvas1)
      .mockResolvedValueOnce(mockCanvas2);

    const { item, load } = usePersonalCanvas('personalcanvas-123');

    await load();
    expect(item.value).toEqual(mockCanvas1);

    await load();
    expect(item.value).toEqual(mockCanvas2);
    expect(mockService.getFullPersonalCanvas).toHaveBeenCalledTimes(2);
  });

  it('should create a new service instance for each composable call', () => {
    const composable1 = usePersonalCanvas('canvas-1');
    const composable2 = usePersonalCanvas('canvas-2');

    expect(composable1).not.toBe(composable2);
    expect(composable1.item).not.toBe(composable2.item);
    expect(composable1.loading).not.toBe(composable2.loading);
  });

  it('should maintain reactivity on item', async () => {
    const mockPersonalCanvas = {
      id: 'personalcanvas-123',
      userId: 'user-123',
      valueProposition: 'Test canvas',
      needsUpdate: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    mockService.getFullPersonalCanvas.mockResolvedValue(mockPersonalCanvas);

    const { item, load } = usePersonalCanvas('personalcanvas-123');

    await load();

    expect(item.value).toEqual(mockPersonalCanvas);
  });

  it('should pass correct canvas id to service', async () => {
    const canvasId = 'specific-canvas-id-456';
    mockService.getFullPersonalCanvas.mockResolvedValue(null);

    const { load } = usePersonalCanvas(canvasId);
    await load();

    expect(mockService.getFullPersonalCanvas).toHaveBeenCalledWith(canvasId);
  });

  it('should handle PersonalCanvas with needsUpdate flag', async () => {
    const mockCanvas = {
      id: 'personalcanvas-123',
      userId: 'user-123',
      valueProposition: 'Outdated',
      needsUpdate: true,
      lastGeneratedAt: '2025-01-01T00:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    mockService.getFullPersonalCanvas.mockResolvedValue(mockCanvas);

    const { item, load } = usePersonalCanvas('personalcanvas-123');

    await load();

    expect(item.value?.needsUpdate).toBe(true);
  });

  it('should handle PersonalCanvas with all sections populated', async () => {
    const completeCanvas = {
      id: 'personalcanvas-123',
      userId: 'user-123',
      valueProposition: 'Full value proposition',
      keyActivities: ['Activity 1', 'Activity 2'],
      strengthsAdvantage: 'Competitive advantage',
      targetRoles: ['Role 1', 'Role 2'],
      channels: ['Channel 1', 'Channel 2'],
      resources: ['Resource 1', 'Resource 2'],
      careerDirection: 'Clear direction',
      painRelievers: ['Pain 1', 'Pain 2'],
      gainCreators: ['Gain 1', 'Gain 2'],
      lastGeneratedAt: '2025-01-15T00:00:00Z',
      needsUpdate: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    mockService.getFullPersonalCanvas.mockResolvedValue(completeCanvas);

    const { item, load } = usePersonalCanvas('personalcanvas-123');

    await load();

    expect(item.value).toEqual(completeCanvas);
    expect(item.value?.keyActivities).toHaveLength(2);
    expect(item.value?.targetRoles).toHaveLength(2);
    expect(item.value?.painRelievers).toHaveLength(2);
  });

  it('should handle PersonalCanvas with empty arrays', async () => {
    const canvasWithEmptyArrays = {
      id: 'personalcanvas-123',
      userId: 'user-123',
      keyActivities: [],
      targetRoles: [],
      channels: [],
      resources: [],
      painRelievers: [],
      gainCreators: [],
      needsUpdate: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as PersonalCanvas;

    mockService.getFullPersonalCanvas.mockResolvedValue(canvasWithEmptyArrays);

    const { item, load } = usePersonalCanvas('personalcanvas-123');

    await load();

    expect(item.value?.keyActivities).toEqual([]);
    expect(item.value?.targetRoles).toEqual([]);
    expect(item.value?.needsUpdate).toBe(true);
  });
});
