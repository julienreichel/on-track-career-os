import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { Experience } from '@/domain/experience/Experience';

// Mock the service
vi.mock('@/domain/starstory/STARStoryService');

describe('useStoryEngine', () => {
  let mockService: ReturnType<typeof vi.mocked<STARStoryService>>;

  beforeEach(() => {
    mockService = {
      getStoriesByExperience: vi.fn(),
      getFullSTARStory: vi.fn(),
      generateStar: vi.fn(),
      generateAchievements: vi.fn(),
      createAndLinkStory: vi.fn(),
      updateStory: vi.fn(),
      deleteStory: vi.fn(),
      linkStoryToExperience: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<STARStoryService>>;

    vi.mocked(STARStoryService).mockImplementation(() => mockService);
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { stories, selectedStory, draftStory, loading, generating, saving, error, hasStories, hasDraft } = useStoryEngine();

      expect(stories.value).toEqual([]);
      expect(selectedStory.value).toBeNull();
      expect(draftStory.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(generating.value).toBe(false);
      expect(saving.value).toBe(false);
      expect(error.value).toBeNull();
      expect(hasStories.value).toBe(false);
      expect(hasDraft.value).toBe(false);
    });
  });

  describe('loadStories', () => {
    it('should load stories for an experience', async () => {
      const mockStories: STARStory[] = [
        { id: 'story-1', situation: 'S1', task: 'T1', action: 'A1', result: 'R1', experienceId: 'exp-123' },
        { id: 'story-2', situation: 'S2', task: 'T2', action: 'A2', result: 'R2', experienceId: 'exp-123' },
      ] as STARStory[];

      mockService.getStoriesByExperience.mockResolvedValue(mockStories);

      const { stories, loadStories, hasStories } = useStoryEngine();

      await loadStories('exp-123');

      expect(mockService.getStoriesByExperience).toHaveBeenCalledWith('exp-123');
      expect(stories.value).toEqual(mockStories);
      expect(hasStories.value).toBe(true);
    });

    it('should handle loading state correctly', async () => {
      mockService.getStoriesByExperience.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 50))
      );

      const { loading, loadStories } = useStoryEngine();

      const promise = loadStories('exp-123');
      expect(loading.value).toBe(true);

      await promise;
      expect(loading.value).toBe(false);
    });

    it('should handle errors when loading stories', async () => {
      mockService.getStoriesByExperience.mockRejectedValue(new Error('Database error'));

      const { error, loadStories } = useStoryEngine();

      await loadStories('exp-123');

      expect(error.value).toBe('Database error');
    });

    it('should require experience ID', async () => {
      const { error, loadStories } = useStoryEngine();

      await loadStories();

      expect(error.value).toBe('Experience ID is required');
      expect(mockService.getStoriesByExperience).not.toHaveBeenCalled();
    });
  });

  describe('loadStory', () => {
    it('should load a single story', async () => {
      const mockStory: STARStory = {
        id: 'story-123',
        situation: 'Performance issue',
        task: 'Optimize',
        action: 'Refactored',
        result: '60% faster',
        experienceId: 'exp-123',
      } as STARStory;

      mockService.getFullSTARStory.mockResolvedValue(mockStory);

      const { selectedStory, loadStory } = useStoryEngine();

      await loadStory('story-123');

      expect(mockService.getFullSTARStory).toHaveBeenCalledWith('story-123');
      expect(selectedStory.value).toEqual(mockStory);
    });

    it('should handle errors when loading story', async () => {
      mockService.getFullSTARStory.mockRejectedValue(new Error('Not found'));

      const { error, loadStory } = useStoryEngine();

      await loadStory('story-123');

      expect(error.value).toBe('Not found');
    });
  });

  describe('createStoryDraft', () => {
    it('should create draft from experience', () => {
      const mockExperience: Experience = {
        id: 'exp-123',
        title: 'Senior Engineer',
        companyName: 'TechCorp',
        responsibilities: ['Lead team', 'Design architecture'],
        tasks: ['Code review', 'Mentoring'],
        rawText: 'Additional context',
        startDate: '2020-01-01',
      } as Experience;

      const { draftStory, createStoryDraft, hasDraft } = useStoryEngine();

      const sourceText = createStoryDraft(mockExperience);

      expect(hasDraft.value).toBe(true);
      expect(draftStory.value).toEqual({
        situation: '',
        task: '',
        action: '',
        result: '',
        achievements: [],
        kpiSuggestions: [],
        experienceId: 'exp-123',
      });
      expect(sourceText).toContain('Senior Engineer');
      expect(sourceText).toContain('TechCorp');
      expect(sourceText).toContain('Lead team');
    });
  });

  describe('runStarInterview', () => {
    it('should generate STAR from text', async () => {
      const mockAiStory: AiSTARStory = {
        situation: 'Team struggled with deployments',
        task: 'Implement CI/CD',
        action: 'Set up GitHub Actions',
        result: 'Reduced deployment time by 70%',
      };

      mockService.generateStar.mockResolvedValue(mockAiStory);

      const { draftStory, runStarInterview, isGenerating } = useStoryEngine();

      await runStarInterview('Led CI/CD implementation...');

      expect(mockService.generateStar).toHaveBeenCalledWith('Led CI/CD implementation...');
      expect(isGenerating.value).toBe(false);
      expect(draftStory.value).toMatchObject({
        situation: mockAiStory.situation,
        task: mockAiStory.task,
        action: mockAiStory.action,
        result: mockAiStory.result,
      });
    });

    it('should update existing draft', async () => {
      const mockAiStory: AiSTARStory = {
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
      };

      mockService.generateStar.mockResolvedValue(mockAiStory);

      const { draftStory, runStarInterview } = useStoryEngine();

      // Create initial draft
      draftStory.value = {
        situation: '',
        task: '',
        action: '',
        result: '',
        achievements: ['Existing achievement'],
        kpiSuggestions: ['Existing KPI'],
        experienceId: 'exp-123',
      };

      await runStarInterview('Test text');

      expect(draftStory.value?.achievements).toEqual(['Existing achievement']);
      expect(draftStory.value?.kpiSuggestions).toEqual(['Existing KPI']);
      expect(draftStory.value?.experienceId).toBe('exp-123');
    });

    it('should reject empty source text', async () => {
      const { error, runStarInterview } = useStoryEngine();

      await runStarInterview('');

      expect(error.value).toBe('Source text is required');
      expect(mockService.generateStar).not.toHaveBeenCalled();
    });

    it('should handle AI generation errors', async () => {
      mockService.generateStar.mockRejectedValue(new Error('AI service error'));

      const { error, runStarInterview } = useStoryEngine();

      await expect(runStarInterview('Test text')).rejects.toThrow('AI service error');
      expect(error.value).toBe('AI service error');
    });
  });

  describe('generateAchievements', () => {
    it('should generate achievements from draft', async () => {
      const mockAchievements: AchievementsAndKpis = {
        achievements: ['Led team successfully', 'Reduced deployment time'],
        kpiSuggestions: ['Deployment time: 70% reduction', 'Team satisfaction: increased'],
      };

      mockService.generateAchievements.mockResolvedValue(mockAchievements);

      const { draftStory, generatedAchievements, generateAchievements } = useStoryEngine();

      draftStory.value = {
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
        achievements: [],
        kpiSuggestions: [],
      };

      await generateAchievements();

      expect(mockService.generateAchievements).toHaveBeenCalledWith({
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
      });
      expect(generatedAchievements.value).toEqual(mockAchievements);
      expect(draftStory.value?.achievements).toEqual(mockAchievements.achievements);
    });

    it('should require a story to generate achievements', async () => {
      const { error, generateAchievements } = useStoryEngine();

      await generateAchievements();

      expect(error.value).toBe('No story available');
      expect(mockService.generateAchievements).not.toHaveBeenCalled();
    });
  });

  describe('saveStory', () => {
    it('should save draft as new story', async () => {
      const mockNewStory: STARStory = {
        id: 'story-new',
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
        experienceId: 'exp-123',
        achievements: ['A1'],
        kpiSuggestions: ['K1'],
      } as STARStory;

      mockService.createAndLinkStory.mockResolvedValue(mockNewStory);

      const { draftStory, stories, selectedStory, saveStory } = useStoryEngine();

      draftStory.value = {
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
        achievements: ['A1'],
        kpiSuggestions: ['K1'],
      };

      const result = await saveStory('exp-123');

      expect(result).toEqual(mockNewStory);
      expect(stories.value).toContainEqual(mockNewStory);
      expect(selectedStory.value).toEqual(mockNewStory);
      expect(draftStory.value).toBeNull();
    });

    it('should require draft to save', async () => {
      const { error, saveStory } = useStoryEngine();

      const result = await saveStory('exp-123');

      expect(result).toBeNull();
      expect(error.value).toBe('No draft to save');
    });

    it('should require experience ID', async () => {
      const { draftStory, error, saveStory } = useStoryEngine();

      draftStory.value = {
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
        achievements: [],
        kpiSuggestions: [],
      };

      const result = await saveStory();

      expect(result).toBeNull();
      expect(error.value).toBe('Experience ID required');
    });
  });

  describe('updateStory', () => {
    it('should update an existing story', async () => {
      const mockUpdatedStory: STARStory = {
        id: 'story-123',
        situation: 'Updated situation',
        task: 'T',
        action: 'A',
        result: 'R',
        experienceId: 'exp-123',
      } as STARStory;

      mockService.updateStory.mockResolvedValue(mockUpdatedStory);

      const { stories, updateStory } = useStoryEngine();

      stories.value = [{ id: 'story-123', situation: 'Old', task: 'T', action: 'A', result: 'R' } as STARStory];

      const result = await updateStory('story-123', { situation: 'Updated situation' });

      expect(result).toEqual(mockUpdatedStory);
      expect(stories.value[0]).toEqual(mockUpdatedStory);
    });

    it('should update selected story if it matches', async () => {
      const mockUpdatedStory: STARStory = {
        id: 'story-123',
        situation: 'Updated',
      } as STARStory;

      mockService.updateStory.mockResolvedValue(mockUpdatedStory);

      const { selectedStory, updateStory } = useStoryEngine();

      selectedStory.value = { id: 'story-123' } as STARStory;

      await updateStory('story-123', { situation: 'Updated' });

      expect(selectedStory.value).toEqual(mockUpdatedStory);
    });
  });

  describe('deleteStory', () => {
    it('should delete a story', async () => {
      mockService.deleteStory.mockResolvedValue();

      const { stories, deleteStory } = useStoryEngine();

      stories.value = [
        { id: 'story-1' } as STARStory,
        { id: 'story-2' } as STARStory,
      ];

      const result = await deleteStory('story-1');

      expect(result).toBe(true);
      expect(stories.value).toHaveLength(1);
      expect(stories.value[0].id).toBe('story-2');
    });

    it('should clear selected story if deleted', async () => {
      mockService.deleteStory.mockResolvedValue();

      const { selectedStory, deleteStory } = useStoryEngine();

      selectedStory.value = { id: 'story-123' } as STARStory;

      await deleteStory('story-123');

      expect(selectedStory.value).toBeNull();
    });
  });

  describe('updateDraft', () => {
    it('should update draft fields', () => {
      const { draftStory, updateDraft } = useStoryEngine();

      draftStory.value = {
        situation: 'Old',
        task: 'T',
        action: 'A',
        result: 'R',
        achievements: [],
        kpiSuggestions: [],
      };

      updateDraft({ situation: 'New', result: 'Updated' });

      expect(draftStory.value.situation).toBe('New');
      expect(draftStory.value.result).toBe('Updated');
      expect(draftStory.value.task).toBe('T');
    });
  });

  describe('clearDraft', () => {
    it('should clear draft and achievements', () => {
      const { draftStory, generatedAchievements, clearDraft } = useStoryEngine();

      draftStory.value = { situation: 'S', task: 'T', action: 'A', result: 'R', achievements: [], kpiSuggestions: [] };
      generatedAchievements.value = { achievements: ['A'], kpiSuggestions: ['K'] };

      clearDraft();

      expect(draftStory.value).toBeNull();
      expect(generatedAchievements.value).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const { stories, selectedStory, draftStory, loading, reset } = useStoryEngine();

      stories.value = [{ id: '1' } as STARStory];
      selectedStory.value = { id: '2' } as STARStory;
      draftStory.value = { situation: 'S', task: 'T', action: 'A', result: 'R', achievements: [], kpiSuggestions: [] };
      loading.value = true;

      reset();

      expect(stories.value).toEqual([]);
      expect(selectedStory.value).toBeNull();
      expect(draftStory.value).toBeNull();
      expect(loading.value).toBe(false);
    });
  });
});
