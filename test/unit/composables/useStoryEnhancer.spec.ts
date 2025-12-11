import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoryEnhancer } from '@/composables/useStoryEnhancer';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

// Mock STARStoryService
vi.mock('@/domain/starstory/STARStoryService', () => ({
  STARStoryService: vi.fn(),
}));

describe('useStoryEnhancer', () => {
  let mockService: {
    generateAchievements: ReturnType<typeof vi.fn>;
  };

  const mockStory: AiSTARStory = {
    situation: 'Led migration project',
    task: 'Migrate legacy system',
    action: 'Designed new architecture',
    result: 'Reduced deployment time by 85%',
  };

  const mockEnhancements: AchievementsAndKpis = {
    achievements: ['Improved efficiency', 'Reduced costs', 'Enhanced scalability'],
    kpiSuggestions: ['85% faster deployments', 'Cost savings of $50K', '99.9% uptime'],
  };

  beforeEach(() => {
    mockService = {
      generateAchievements: vi.fn(),
    };
    vi.mocked(STARStoryService).mockImplementation(() => mockService as never);
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const {
        achievements,
        kpiSuggestions,
        generating,
        error,
        hasAchievements,
        hasKpis,
        hasEnhancements,
      } = useStoryEnhancer();

      expect(achievements.value).toEqual([]);
      expect(kpiSuggestions.value).toEqual([]);
      expect(generating.value).toBe(false);
      expect(error.value).toBeNull();
      expect(hasAchievements.value).toBe(false);
      expect(hasKpis.value).toBe(false);
      expect(hasEnhancements.value).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate achievements and KPIs successfully', async () => {
      mockService.generateAchievements.mockResolvedValue(mockEnhancements);

      const { generate, achievements, kpiSuggestions, generating, error } = useStoryEnhancer();

      const generatePromise = generate(mockStory);
      expect(generating.value).toBe(true);

      const result = await generatePromise;

      expect(result).toEqual(mockEnhancements);
      expect(achievements.value).toEqual(mockEnhancements.achievements);
      expect(kpiSuggestions.value).toEqual(mockEnhancements.kpiSuggestions);
      expect(generating.value).toBe(false);
      expect(error.value).toBeNull();
      expect(mockService.generateAchievements).toHaveBeenCalledWith(mockStory);
    });

    it('should reject incomplete story', async () => {
      const incompleteStory: AiSTARStory = {
        situation: '',
        task: 'Some task',
        action: 'Some action',
        result: 'Some result',
      };

      const { generate, error } = useStoryEnhancer();

      const result = await generate(incompleteStory);

      expect(result).toBeNull();
      expect(error.value).toBe('enhancer.errors.incompleteStory');
      expect(mockService.generateAchievements).not.toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('AI generation failed');
      mockService.generateAchievements.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { generate, error, generating } = useStoryEnhancer();

      const result = await generate(mockStory);

      expect(result).toBeNull();
      expect(generating.value).toBe(false);
      expect(error.value).toBe('AI generation failed');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty achievements and KPIs', async () => {
      mockService.generateAchievements.mockResolvedValue({
        achievements: [],
        kpiSuggestions: [],
      });

      const { generate, achievements, kpiSuggestions } = useStoryEnhancer();

      await generate(mockStory);

      expect(achievements.value).toEqual([]);
      expect(kpiSuggestions.value).toEqual([]);
    });
  });

  describe('regenerate', () => {
    it('should regenerate achievements and KPIs', async () => {
      mockService.generateAchievements.mockResolvedValue(mockEnhancements);

      const { regenerate, achievements } = useStoryEnhancer();

      const result = await regenerate(mockStory);

      expect(result).toEqual(mockEnhancements);
      expect(achievements.value).toEqual(mockEnhancements.achievements);
      expect(mockService.generateAchievements).toHaveBeenCalledWith(mockStory);
    });
  });

  describe('achievement management', () => {
    it('should add achievement', () => {
      const { addAchievement, achievements } = useStoryEnhancer();

      const result = addAchievement('New achievement');

      expect(result).toBe(true);
      expect(achievements.value).toEqual(['New achievement']);
    });

    it('should trim whitespace when adding achievement', () => {
      const { addAchievement, achievements } = useStoryEnhancer();

      addAchievement('  Trimmed achievement  ');

      expect(achievements.value).toEqual(['Trimmed achievement']);
    });

    it('should reject empty achievement', () => {
      const { addAchievement, achievements } = useStoryEnhancer();

      expect(addAchievement('')).toBe(false);
      expect(addAchievement('   ')).toBe(false);
      expect(achievements.value).toEqual([]);
    });

    it('should update achievement at index', () => {
      const { load, updateAchievement, achievements } = useStoryEnhancer();
      load({ achievements: ['First', 'Second', 'Third'], kpiSuggestions: [] });

      const result = updateAchievement(1, 'Updated Second');

      expect(result).toBe(true);
      expect(achievements.value[1]).toBe('Updated Second');
    });

    it('should reject invalid index when updating achievement', () => {
      const { load, updateAchievement } = useStoryEnhancer();
      load({ achievements: ['First'], kpiSuggestions: [] });

      expect(updateAchievement(-1, 'Invalid')).toBe(false);
      expect(updateAchievement(5, 'Invalid')).toBe(false);
    });

    it('should remove achievement at index', () => {
      const { load, removeAchievement, achievements } = useStoryEnhancer();
      load({ achievements: ['First', 'Second', 'Third'], kpiSuggestions: [] });

      const result = removeAchievement(1);

      expect(result).toBe(true);
      expect(achievements.value).toEqual(['First', 'Third']);
    });

    it('should reject invalid index when removing achievement', () => {
      const { load, removeAchievement } = useStoryEnhancer();
      load({ achievements: ['First'], kpiSuggestions: [] });

      expect(removeAchievement(-1)).toBe(false);
      expect(removeAchievement(5)).toBe(false);
    });
  });

  describe('KPI management', () => {
    it('should add KPI', () => {
      const { addKpi, kpiSuggestions } = useStoryEnhancer();

      const result = addKpi('New KPI');

      expect(result).toBe(true);
      expect(kpiSuggestions.value).toEqual(['New KPI']);
    });

    it('should trim whitespace when adding KPI', () => {
      const { addKpi, kpiSuggestions } = useStoryEnhancer();

      addKpi('  Trimmed KPI  ');

      expect(kpiSuggestions.value).toEqual(['Trimmed KPI']);
    });

    it('should reject empty KPI', () => {
      const { addKpi, kpiSuggestions } = useStoryEnhancer();

      expect(addKpi('')).toBe(false);
      expect(addKpi('   ')).toBe(false);
      expect(kpiSuggestions.value).toEqual([]);
    });

    it('should update KPI at index', () => {
      const { load, updateKpi, kpiSuggestions } = useStoryEnhancer();
      load({ achievements: [], kpiSuggestions: ['First', 'Second', 'Third'] });

      const result = updateKpi(1, 'Updated Second');

      expect(result).toBe(true);
      expect(kpiSuggestions.value[1]).toBe('Updated Second');
    });

    it('should reject invalid index when updating KPI', () => {
      const { load, updateKpi } = useStoryEnhancer();
      load({ achievements: [], kpiSuggestions: ['First'] });

      expect(updateKpi(-1, 'Invalid')).toBe(false);
      expect(updateKpi(5, 'Invalid')).toBe(false);
    });

    it('should remove KPI at index', () => {
      const { load, removeKpi, kpiSuggestions } = useStoryEnhancer();
      load({ achievements: [], kpiSuggestions: ['First', 'Second', 'Third'] });

      const result = removeKpi(1);

      expect(result).toBe(true);
      expect(kpiSuggestions.value).toEqual(['First', 'Third']);
    });

    it('should reject invalid index when removing KPI', () => {
      const { load, removeKpi } = useStoryEnhancer();
      load({ achievements: [], kpiSuggestions: ['First'] });

      expect(removeKpi(-1)).toBe(false);
      expect(removeKpi(5)).toBe(false);
    });
  });

  describe('load', () => {
    it('should load achievements and KPIs', () => {
      const { load, achievements, kpiSuggestions } = useStoryEnhancer();

      load(mockEnhancements);

      expect(achievements.value).toEqual(mockEnhancements.achievements);
      expect(kpiSuggestions.value).toEqual(mockEnhancements.kpiSuggestions);
    });

    it('should handle undefined arrays', () => {
      const { load, achievements, kpiSuggestions } = useStoryEnhancer();

      load({ achievements: undefined, kpiSuggestions: undefined });

      expect(achievements.value).toEqual([]);
      expect(kpiSuggestions.value).toEqual([]);
    });

    it('should create copies of arrays', () => {
      const { load, achievements, addAchievement } = useStoryEnhancer();
      const original = ['Original'];

      load({ achievements: original, kpiSuggestions: [] });
      addAchievement('New');

      // Original array should not be modified
      expect(original).toEqual(['Original']);
      expect(achievements.value).toEqual(['Original', 'New']);
    });
  });

  describe('getEnhancements', () => {
    it('should return current enhancements as object', () => {
      const { load, getEnhancements } = useStoryEnhancer();
      load(mockEnhancements);

      const result = getEnhancements();

      expect(result).toEqual(mockEnhancements);
    });

    it('should return copies of arrays', () => {
      const { load, getEnhancements, addAchievement } = useStoryEnhancer();
      load(mockEnhancements);

      const result = getEnhancements();
      addAchievement('New');

      // Returned object should not be affected by subsequent changes
      expect(result.achievements).toEqual(mockEnhancements.achievements);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockService.generateAchievements.mockResolvedValue(mockEnhancements);

      const { generate, reset, achievements, kpiSuggestions, error, generating, hasEnhancements } =
        useStoryEnhancer();

      await generate(mockStory);
      expect(hasEnhancements.value).toBe(true);

      reset();

      expect(achievements.value).toEqual([]);
      expect(kpiSuggestions.value).toEqual([]);
      expect(error.value).toBeNull();
      expect(generating.value).toBe(false);
      expect(hasEnhancements.value).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('should update hasAchievements when achievements change', () => {
      const { addAchievement, hasAchievements } = useStoryEnhancer();

      expect(hasAchievements.value).toBe(false);

      addAchievement('First achievement');

      expect(hasAchievements.value).toBe(true);
    });

    it('should update hasKpis when KPIs change', () => {
      const { addKpi, hasKpis } = useStoryEnhancer();

      expect(hasKpis.value).toBe(false);

      addKpi('First KPI');

      expect(hasKpis.value).toBe(true);
    });

    it('should update hasEnhancements when either achievements or KPIs exist', () => {
      const { addAchievement, reset, hasEnhancements } = useStoryEnhancer();

      expect(hasEnhancements.value).toBe(false);

      addAchievement('Achievement');
      expect(hasEnhancements.value).toBe(true);

      reset();
      expect(hasEnhancements.value).toBe(false);

      const { addKpi, hasEnhancements: hasEnhancements2 } = useStoryEnhancer();
      addKpi('KPI');
      expect(hasEnhancements2.value).toBe(true);
    });
  });
});
