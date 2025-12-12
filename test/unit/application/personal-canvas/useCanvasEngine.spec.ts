import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvasEngine } from '@/application/personal-canvas/useCanvasEngine';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';

// Mock the dependencies
vi.mock('@/domain/personal-canvas/PersonalCanvasService');
vi.mock('@/domain/personal-canvas/PersonalCanvasRepository');

describe('useCanvasEngine', () => {
  let mockService: ReturnType<typeof vi.mocked<PersonalCanvasService>>;
  let mockRepository: ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;

  const mockPersonalCanvas = {
    id: 'canvas-123',
    userId: 'user-123',
    customerSegments: ['Tech Companies', 'Startups'],
    valueProposition: [
      'Experienced engineer with AI expertise',
      'Strong technical and leadership skills',
    ],
    channels: ['LinkedIn', 'GitHub', 'Conferences'],
    customerRelationships: ['Professional networking', 'Open source contributions'],
    keyActivities: ['Development', 'Mentoring', 'Architecture'],
    keyResources: ['Technical Blog', 'Open Source', 'Network'],
    keyPartners: ['Tech mentors', 'Recruiters'],
    costStructure: ['Conferences', 'Certifications'],
    revenueStreams: ['Salary', 'Equity', 'Bonuses'],
    lastGeneratedAt: '2025-01-15T00:00:00Z',
    needsUpdate: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    owner: 'user-123::user-123',
  } as unknown as PersonalCanvas;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      getFullPersonalCanvas: vi.fn(),
      regenerateCanvas: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasService>>;

    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;

    // Mock constructor returns
    vi.mocked(PersonalCanvasService).mockImplementation(() => mockService);
    vi.mocked(PersonalCanvasRepository).mockImplementation(() => mockRepository);
  });

  describe('loadCanvas', () => {
    it('should load canvas successfully', async () => {
      mockService.getFullPersonalCanvas.mockResolvedValue(mockPersonalCanvas);

      const { canvas, loading, error, loadCanvas } = useCanvasEngine();

      expect(canvas.value).toBeNull();
      expect(loading.value).toBe(false);

      await loadCanvas('canvas-123');

      expect(mockService.getFullPersonalCanvas).toHaveBeenCalledWith('canvas-123');
      expect(canvas.value).toEqual(mockPersonalCanvas);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should handle loading state correctly', async () => {
      let resolvePromise: (value: PersonalCanvas) => void;
      const promise = new Promise<PersonalCanvas>((resolve) => {
        resolvePromise = resolve;
      });
      mockService.getFullPersonalCanvas.mockReturnValue(promise);

      const { loading, loadCanvas } = useCanvasEngine();

      const loadPromise = loadCanvas('canvas-123');
      expect(loading.value).toBe(true);

      resolvePromise!(mockPersonalCanvas);
      await loadPromise;

      expect(loading.value).toBe(false);
    });

    it('should handle errors when loading canvas', async () => {
      const errorMessage = 'Failed to load canvas';
      mockService.getFullPersonalCanvas.mockRejectedValue(new Error(errorMessage));

      const { canvas, loading, error, loadCanvas } = useCanvasEngine();

      await loadCanvas('canvas-123');

      expect(canvas.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBe(errorMessage);
    });

    it('should clear previous error on new load', async () => {
      // First call fails
      mockService.getFullPersonalCanvas.mockRejectedValueOnce(new Error('First error'));
      const { error, loadCanvas } = useCanvasEngine();

      await loadCanvas('canvas-123');
      expect(error.value).toBe('First error');

      // Second call succeeds
      mockService.getFullPersonalCanvas.mockResolvedValueOnce(mockPersonalCanvas);
      await loadCanvas('canvas-123');

      expect(error.value).toBeNull();
    });
  });

  describe('saveCanvas', () => {
    it('should create new canvas when no existing canvas', async () => {
      const canvasData = {
        userId: 'user-123',
        customerSegments: ['Segment 1'],
        valueProposition: ['New canvas value'],
        channels: ['Channel 1'],
        customerRelationships: ['Relationship 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        keyPartners: ['Partner 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        owner: 'user-123::user-123',
      } as unknown as PersonalCanvas;

      const createdCanvas = {
        ...canvasData,
        id: 'new-canvas-123',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      } as unknown as PersonalCanvas;
      mockRepository.create.mockResolvedValue(createdCanvas);

      const { canvas, loading, error, saveCanvas } = useCanvasEngine();

      await saveCanvas(canvasData);

      expect(mockRepository.create).toHaveBeenCalledWith(canvasData);
      expect(canvas.value).toEqual(createdCanvas);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should update existing canvas when canvas is loaded', async () => {
      mockService.getFullPersonalCanvas.mockResolvedValue(mockPersonalCanvas);

      const { canvas, loadCanvas, saveCanvas } = useCanvasEngine();

      // Load existing canvas
      await loadCanvas('canvas-123');
      expect(canvas.value?.id).toBe('canvas-123');

      // Update canvas
      const updatedData = {
        userId: 'user-123',
        customerSegments: ['Updated segment'],
        valueProposition: ['Updated value proposition'],
        channels: ['Updated channel'],
        customerRelationships: ['Updated relationship'],
        keyActivities: ['Updated activity'],
        keyResources: ['Updated resource'],
        keyPartners: ['Updated partner'],
        costStructure: ['Updated cost'],
        revenueStreams: ['Updated revenue'],
        lastGeneratedAt: '2025-01-16T00:00:00Z',
        needsUpdate: false,
        owner: 'user-123::user-123',
      };

      const updatedCanvas = {
        ...updatedData,
        id: 'canvas-123',
        createdAt: mockPersonalCanvas.createdAt,
        updatedAt: '2025-01-16T00:00:00Z',
      } as unknown as PersonalCanvas;
      mockRepository.update.mockResolvedValue(updatedCanvas);

      await saveCanvas(updatedData as any);

      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'canvas-123',
        ...updatedData,
      });
      expect(canvas.value).toEqual(updatedCanvas);
    });

    it('should handle save errors', async () => {
      const canvasData = {
        userId: 'user-123',
        customerSegments: [],
        valueProposition: ['Value'],
        channels: [],
        customerRelationships: [],
        keyActivities: [],
        keyResources: [],
        keyPartners: [],
        costStructure: [],
        revenueStreams: [],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        owner: 'user-123::user-123',
      };

      mockRepository.create.mockRejectedValue(new Error('Save failed'));

      const { error, saveCanvas } = useCanvasEngine();

      await saveCanvas(canvasData as any);

      expect(error.value).toBe('Save failed');
    });

    it('should handle loading state during save', async () => {
      const canvasData = {
        userId: 'user-123',
        customerSegments: [],
        valueProposition: ['Value'],
        channels: [],
        customerRelationships: [],
        keyActivities: [],
        keyResources: [],
        keyPartners: [],
        costStructure: [],
        revenueStreams: [],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        owner: 'user-123::user-123',
      };

      let resolvePromise: (value: PersonalCanvas) => void;
      const promise = new Promise<PersonalCanvas>((resolve) => {
        resolvePromise = resolve;
      });
      mockRepository.create.mockReturnValue(promise);

      const { loading, saveCanvas } = useCanvasEngine();

      const savePromise = saveCanvas(canvasData as any);
      expect(loading.value).toBe(true);

      resolvePromise!({
        ...canvasData,
        id: 'new-id',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      } as unknown as PersonalCanvas);
      await savePromise;

      expect(loading.value).toBe(false);
    });
  });

  describe('regenerateCanvas', () => {
    it('should regenerate canvas using AI operation', async () => {
      const input: PersonalCanvasInput = {
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Engineer',
          summary: '8 years of experience',
        },
        experiences: [
          {
            title: 'Senior Engineer',
            company: 'Tech Corp',
            responsibilities: ['Led development team'],
          },
        ],
        stories: [
          {
            situation: 'Complex migration',
            task: 'Migrate database',
            action: 'Designed migration strategy',
            result: 'Zero downtime migration',
          },
        ],
      };

      const generatedCanvas = {
        id: 'generated-123',
        userId: 'user-123',
        customerSegments: ['AI generated segment'],
        valueProposition: ['AI generated value proposition'],
        channels: ['AI generated channel'],
        customerRelationships: ['AI generated relationship'],
        keyActivities: ['AI generated activity'],
        keyResources: ['AI generated resource'],
        keyPartners: ['AI generated partner'],
        costStructure: ['AI generated cost'],
        revenueStreams: ['AI generated revenue'],
        lastGeneratedAt: '2025-01-15T00:00:00Z',
        needsUpdate: false,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as unknown as PersonalCanvas;

      mockService.regenerateCanvas.mockResolvedValue(generatedCanvas);

      const { canvas, loading, error, regenerateCanvas } = useCanvasEngine();

      const result = await regenerateCanvas(input);

      expect(mockService.regenerateCanvas).toHaveBeenCalledWith(input);
      expect(result).toEqual(generatedCanvas);
      expect(canvas.value).toEqual(generatedCanvas);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should handle regeneration errors', async () => {
      const mockInput: PersonalCanvasInput = {
        profile: { fullName: 'John Doe', headline: 'Engineer', summary: '5 years' },
        experiences: [],
        stories: [],
      };

      mockService.regenerateCanvas.mockRejectedValue(new Error('AI service error'));

      const { canvas, error, regenerateCanvas } = useCanvasEngine();

      const result = await regenerateCanvas(mockInput);

      expect(result).toBeNull();
      expect(canvas.value).toBeNull();
      expect(error.value).toBe('AI service error');
    });

    it('should handle loading state during regeneration', async () => {
      const input: PersonalCanvasInput = {
        profile: { fullName: 'John', headline: 'Dev', summary: '3 years' },
        experiences: [],
        stories: [],
      };

      let resolvePromise: (value: PersonalCanvas) => void;
      const promise = new Promise<PersonalCanvas>((resolve) => {
        resolvePromise = resolve;
      });
      mockService.regenerateCanvas.mockReturnValue(promise);

      const { loading, regenerateCanvas } = useCanvasEngine();

      const regeneratePromise = regenerateCanvas(input);
      expect(loading.value).toBe(true);

      resolvePromise!(mockPersonalCanvas);
      await regeneratePromise;

      expect(loading.value).toBe(false);
    });

    it('should return canvas on successful regeneration', async () => {
      const input: PersonalCanvasInput = {
        profile: { fullName: 'Jane Smith', headline: 'Staff Engineer', summary: '10 years' },
        experiences: [],
        stories: [],
      };

      mockService.regenerateCanvas.mockResolvedValue(mockPersonalCanvas);

      const { regenerateCanvas } = useCanvasEngine();

      const result = await regenerateCanvas(input);

      expect(result).not.toBeNull();
      expect(result).toEqual(mockPersonalCanvas);
    });
  });

  describe('reactive state', () => {
    it('should initialize with null canvas and false loading', () => {
      const { canvas, loading, error } = useCanvasEngine();

      expect(canvas.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should maintain state across multiple operations', async () => {
      mockService.getFullPersonalCanvas.mockResolvedValue(mockPersonalCanvas);

      const { canvas, loadCanvas } = useCanvasEngine();

      await loadCanvas('canvas-123');
      expect(canvas.value).toEqual(mockPersonalCanvas);

      // Canvas should persist
      expect(canvas.value).toEqual(mockPersonalCanvas);
    });
  });
});
