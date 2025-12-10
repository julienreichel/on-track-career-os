import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

/**
 * useStoryEnhancer Composable
 *
 * Manages achievements and KPIs generation & editing for STAR stories:
 * - AI-powered generation from story content
 * - Manual editing of achievements and KPIs
 * - Regeneration capability
 * - State management for enhanced data
 */
export function useStoryEnhancer() {
  // State
  const achievements = ref<string[]>([]);
  const kpiSuggestions = ref<string[]>([]);
  const generating = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

  // Computed
  const hasAchievements = computed(() => achievements.value.length > 0);
  const hasKpis = computed(() => kpiSuggestions.value.length > 0);
  const hasEnhancements = computed(() => hasAchievements.value || hasKpis.value);

  /**
   * Generate achievements and KPIs from story
   */
  const generate = async (story: AiSTARStory) => {
    if (!story.situation || !story.task || !story.action || !story.result) {
      error.value = 'enhancer.errors.incompleteStory';
      return null;
    }

    generating.value = true;
    error.value = null;

    try {
      const result = await service.generateAchievements(story);

      achievements.value = result.achievements || [];
      kpiSuggestions.value = result.kpiSuggestions || [];

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'enhancer.errors.generationFailed';
      console.error('[useStoryEnhancer] Generation error:', err);
      return null;
    } finally {
      generating.value = false;
    }
  };

  /**
   * Regenerate achievements and KPIs
   */
  const regenerate = async (story: AiSTARStory) => {
    return await generate(story);
  };

  /**
   * Add new achievement
   */
  const addAchievement = (achievement: string) => {
    if (!achievement.trim()) return false;
    achievements.value.push(achievement.trim());
    return true;
  };

  /**
   * Update achievement at index
   */
  const updateAchievement = (index: number, value: string) => {
    if (index < 0 || index >= achievements.value.length) return false;
    achievements.value[index] = value;
    return true;
  };

  /**
   * Remove achievement at index
   */
  const removeAchievement = (index: number) => {
    if (index < 0 || index >= achievements.value.length) return false;
    achievements.value.splice(index, 1);
    return true;
  };

  /**
   * Add new KPI suggestion
   */
  const addKpi = (kpi: string) => {
    if (!kpi.trim()) return false;
    kpiSuggestions.value.push(kpi.trim());
    return true;
  };

  /**
   * Update KPI suggestion at index
   */
  const updateKpi = (index: number, value: string) => {
    if (index < 0 || index >= kpiSuggestions.value.length) return false;
    kpiSuggestions.value[index] = value;
    return true;
  };

  /**
   * Remove KPI suggestion at index
   */
  const removeKpi = (index: number) => {
    if (index < 0 || index >= kpiSuggestions.value.length) return false;
    kpiSuggestions.value.splice(index, 1);
    return true;
  };

  /**
   * Load existing enhancements into state
   */
  const load = (data: AchievementsAndKpis) => {
    achievements.value = [...(data.achievements || [])];
    kpiSuggestions.value = [...(data.kpiSuggestions || [])];
  };

  /**
   * Get current enhancements as object
   */
  const getEnhancements = (): AchievementsAndKpis => ({
    achievements: [...achievements.value],
    kpiSuggestions: [...kpiSuggestions.value],
  });

  /**
   * Reset state
   */
  const reset = () => {
    achievements.value = [];
    kpiSuggestions.value = [];
    error.value = null;
    generating.value = false;
  };

  return {
    // State
    achievements,
    kpiSuggestions,
    generating,
    error,

    // Computed
    hasAchievements,
    hasKpis,
    hasEnhancements,

    // Actions
    generate,
    regenerate,
    addAchievement,
    updateAchievement,
    removeAchievement,
    addKpi,
    updateKpi,
    removeKpi,
    load,
    getEnhancements,
    reset,
  };
}
