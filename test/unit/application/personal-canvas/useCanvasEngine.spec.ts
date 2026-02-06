import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvasEngine } from '@/application/personal-canvas/useCanvasEngine';
import { PersonalCanvasService } from '@/domain/personal-canvas/PersonalCanvasService';
import { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
import { withMockedConsoleError } from '../../../utils/withMockedConsole';

// Mock the dependencies
vi.mock('@/domain/personal-canvas/PersonalCanvasService');
vi.mock('@/domain/personal-canvas/PersonalCanvasRepository');
vi.mock('@/domain/user-profile/UserProfileRepository');

vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));

describe('useCanvasEngine', () => {
  let mockService: ReturnType<typeof vi.mocked<PersonalCanvasService>>;
  let mockRepository: ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;
  let mockUserProfileRepo: ReturnType<typeof vi.mocked<UserProfileRepository>>;

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

  const mockUserProfile = {
    id: 'user-123',
    fullName: 'John Doe',
    headline: 'Senior Engineer',
    location: 'Paris, France',
    skills: ['TypeScript', 'Leadership'],
  };

  const mockExperience = {
    id: 'exp-1',
    title: 'Senior Engineer',
    companyName: 'Tech Corp',
    startDate: '2020-01',
    endDate: '2024-01',
    experienceType: 'work',
    responsibilities: ['Lead development', 'Mentor team'],
    tasks: ['Build features', 'Code reviews'],
  };

  const mockStory = {
    id: 'story-1',
    situation: 'System performance issues',
    task: 'Improve response time',
    action: 'Optimized database queries',
    result: '50% faster response',
    achievements: ['Reduced latency', 'Improved UX'],
    kpiSuggestions: ['Response time: 200ms -> 100ms'],
  };
  const mockProfileWithExperiences = {
    ...mockUserProfile,
    experiences: [{ ...mockExperience, stories: [mockStory] }],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      getFullPersonalCanvas: vi.fn(),
      regenerateCanvas: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasService>>;

    mockRepository = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<PersonalCanvasRepository>>;

    mockUserProfileRepo = {
      get: vi.fn(),
      getCanvasSnapshot: vi.fn(),
      getForTailoring: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<UserProfileRepository>>;

    // Mock constructor returns
    vi.mocked(PersonalCanvasService).mockImplementation(() => mockService);
    vi.mocked(PersonalCanvasRepository).mockImplementation(() => mockRepository);
    vi.mocked(UserProfileRepository).mockImplementation(() => mockUserProfileRepo);
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

    it(
      'should handle errors when loading canvas',
      withMockedConsoleError(async () => {
        const errorMessage = 'Failed to load canvas';
        mockService.getFullPersonalCanvas.mockRejectedValue(new Error(errorMessage));

        const { canvas, loading, error, loadCanvas } = useCanvasEngine();

        await loadCanvas('canvas-123');

        expect(canvas.value).toBeNull();
        expect(loading.value).toBe(false);
        expect(error.value).toBe(errorMessage);
      })
    );

    it(
      'should clear previous error on new load',
      withMockedConsoleError(async () => {
        // First call fails
        mockService.getFullPersonalCanvas.mockRejectedValueOnce(new Error('First error'));
        const { error, loadCanvas } = useCanvasEngine();

        await loadCanvas('canvas-123');
        expect(error.value).toBe('First error');

        // Second call succeeds
        mockService.getFullPersonalCanvas.mockResolvedValueOnce(mockPersonalCanvas);
        await loadCanvas('canvas-123');

        expect(error.value).toBeNull();
      })
    );
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

    it(
      'should handle save errors',
      withMockedConsoleError(async () => {
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
      })
    );

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
          location: 'Paris, France',
        },
        experiences: [
          {
            title: 'Senior Engineer',
            companyName: 'Tech Corp',
            experienceType: 'work',
            responsibilities: ['Led development team'],
            tasks: [],
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

    it(
      'should handle regeneration errors',
      withMockedConsoleError(async () => {
        const mockInput: PersonalCanvasInput = {
          profile: { fullName: 'John Doe', headline: 'Engineer' },
          experiences: [],
          stories: [],
        };

        mockService.regenerateCanvas.mockRejectedValue(new Error('AI service error'));

        const { canvas, error, regenerateCanvas } = useCanvasEngine();

        const result = await regenerateCanvas(mockInput);

        expect(result).toBeNull();
        expect(canvas.value).toBeNull();
        expect(error.value).toBe('AI service error');
      })
    );

    it('should not manage loading state during regeneration (caller manages it)', async () => {
      const input: PersonalCanvasInput = {
        profile: { fullName: 'John', headline: 'Dev' },
        experiences: [],
        stories: [],
      };

      mockService.regenerateCanvas.mockResolvedValue(mockPersonalCanvas);

      const { loading, regenerateCanvas } = useCanvasEngine();

      // Loading state should remain false as it's managed by the caller (page component)
      expect(loading.value).toBe(false);

      await regenerateCanvas(input);

      // Loading state still false - caller is responsible for managing it
      expect(loading.value).toBe(false);
    });

    it('should return canvas on successful regeneration', async () => {
      const input: PersonalCanvasInput = {
        profile: { fullName: 'Jane Smith', headline: 'Staff Engineer' },
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

  describe('initializeForUser', () => {
    it('should load user profile and existing canvas', async () => {
      mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
      mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(mockPersonalCanvas);

      const { profile, canvas, initializeForUser } = useCanvasEngine();

      await initializeForUser('user-123');

      expect(profile.value).toEqual(mockUserProfile);
      expect(canvas.value).toEqual(mockPersonalCanvas);
      expect(mockUserProfileRepo.get).toHaveBeenCalledWith('user-123');
      expect(mockUserProfileRepo.getCanvasSnapshot).toHaveBeenCalledWith('user-123');
    });

    it('should handle missing user profile', async () => {
      mockUserProfileRepo.get.mockResolvedValue(null);

      const { error, initializeForUser } = useCanvasEngine();

      await initializeForUser('user-123');

      expect(error.value).toBe('User profile not found');
    });

    it('should handle user without existing canvas', async () => {
      mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
      mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(null);

      const { profile, canvas, error, initializeForUser } = useCanvasEngine();

      await initializeForUser('user-123');

      expect(profile.value).toEqual(mockUserProfile);
      expect(canvas.value).toBeNull();
      expect(error.value).toBeNull(); // No error for missing canvas
    });
  });

  describe('generateAndSave', () => {
    it('should generate and save canvas successfully', async () => {
      // Setup: user with no existing canvas
      // AI returns canvas without ID (new canvas scenario)
      const newCanvas = { ...mockPersonalCanvas };
      delete (newCanvas as any).id;

      mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
      mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(null); // No existing canvas
      mockUserProfileRepo.getForTailoring.mockResolvedValue(mockProfileWithExperiences);
      mockService.regenerateCanvas.mockResolvedValue(newCanvas as PersonalCanvas);
      mockRepository.create.mockResolvedValue(mockPersonalCanvas);

      const { canvas, generateAndSave, initializeForUser } = useCanvasEngine();

      // Initialize profile first (no canvas will be loaded)
      await initializeForUser('user-123');
      expect(canvas.value).toBeNull(); // Verify no canvas exists

      const success = await generateAndSave();

      expect(success).toBe(true);
      expect(mockService.regenerateCanvas).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should update existing canvas instead of creating new one', async () => {
      const existingCanvas = { ...mockPersonalCanvas, id: 'existing-id' };
      mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
      mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(existingCanvas);
      mockUserProfileRepo.getForTailoring.mockResolvedValue(mockProfileWithExperiences);
      mockService.regenerateCanvas.mockResolvedValue(mockPersonalCanvas);
      mockRepository.update.mockResolvedValue(mockPersonalCanvas);

      const { generateAndSave, initializeForUser } = useCanvasEngine();

      await initializeForUser('user-123');
      const success = await generateAndSave();

      expect(success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should return false when no profile available', async () => {
      const { generateAndSave } = useCanvasEngine();

      const success = await generateAndSave();

      expect(success).toBe(false);
    });

    it(
      'should handle generation errors',
      withMockedConsoleError(async () => {
        mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
        mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(null);
        mockUserProfileRepo.getForTailoring.mockResolvedValue({
          ...mockUserProfile,
          experiences: [],
        });
        mockService.regenerateCanvas.mockRejectedValue(new Error('AI service error'));

        const { error, generateAndSave, initializeForUser } = useCanvasEngine();

        await initializeForUser('user-123');
        const success = await generateAndSave();

        expect(success).toBe(false);
        expect(error.value).toBe('AI service error');
      })
    );
  });

  describe('regenerateAndSave', () => {
    it('should regenerate and save canvas successfully', async () => {
      mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
      mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(null);
      mockUserProfileRepo.getForTailoring.mockResolvedValue(mockProfileWithExperiences);
      mockService.regenerateCanvas.mockResolvedValue(mockPersonalCanvas);
      mockRepository.create.mockResolvedValue(mockPersonalCanvas);

      const { canvas, regenerateAndSave, initializeForUser } = useCanvasEngine();

      await initializeForUser('user-123');
      const success = await regenerateAndSave();

      expect(success).toBe(true);
      expect(canvas.value).toEqual(mockPersonalCanvas);
    });
  });

  describe('saveEdits', () => {
    it('should save manual edits to canvas', async () => {
      mockUserProfileRepo.get.mockResolvedValue(mockUserProfile);
      mockUserProfileRepo.getCanvasSnapshot.mockResolvedValue(mockPersonalCanvas);
      mockRepository.update.mockResolvedValue({
        ...mockPersonalCanvas,
        valueProposition: ['Updated value prop'],
      });

      const { saveEdits, initializeForUser } = useCanvasEngine();

      await initializeForUser('user-123');

      const updates = { valueProposition: ['Updated value prop'] };
      const success = await saveEdits(updates);

      expect(success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          valueProposition: ['Updated value prop'],
        })
      );
    });

    it('should return false when no canvas available', async () => {
      const { saveEdits } = useCanvasEngine();

      const success = await saveEdits({ valueProposition: ['Test'] });

      expect(success).toBe(false);
    });

    it('should return false when no profile available', async () => {
      const engine = useCanvasEngine();

      // Manually set canvas without profile
      engine.canvas.value = mockPersonalCanvas;

      const success = await engine.saveEdits({ valueProposition: ['Test'] });

      expect(success).toBe(false);
    });
  });
});
