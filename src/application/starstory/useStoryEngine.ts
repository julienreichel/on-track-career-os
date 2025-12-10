import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { Experience } from '@/domain/experience/Experience';

/**
 * Story Engine Draft State
 */
export interface StoryDraft {
  situation: string;
  task: string;
  action: string;
  result: string;
  achievements: string[];
  kpiSuggestions: string[];
  experienceId?: string;
}

/**
 * Story Engine Composable
 * Single API for STAR story management including AI generation
 *
 * Workflows:
 * 1. Load stories for an experience
 * 2. Create new story draft → AI generation → Save
 * 3. Edit existing story
 * 4. Generate achievements from story
 *
 * @param experienceId - Optional experience ID for context
 */
// eslint-disable-next-line max-lines-per-function -- Composable API requires comprehensive interface
export function useStoryEngine(experienceId?: Ref<string> | string) {
  // Reactive state
  const stories = ref<STARStory[]>([]);
  const selectedStory = ref<STARStory | null>(null);
  const draftStory = ref<StoryDraft | null>(null);
  const generatedAchievements = ref<AchievementsAndKpis | null>(null);

  const loading = ref(false);
  const saving = ref(false);
  const generating = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

  // Computed
  const hasStories = computed(() => stories.value.length > 0);
  const hasDraft = computed(() => draftStory.value !== null);
  const isGenerating = computed(() => generating.value);

  // Helper to resolve experience ID
  const getExperienceId = (expId?: string) => {
    return (
      expId ||
      draftStory.value?.experienceId ||
      (typeof experienceId === 'string' ? experienceId : experienceId?.value)
    );
  };

  // Load stories for experience
  const loadStories = async (expId?: string) => {
    const targetId = getExperienceId(expId);
    if (!targetId) {
      error.value = 'Experience ID is required';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      stories.value = await service.getStoriesByExperience(targetId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load stories';
      console.error('[useStoryEngine] Error:', err);
    } finally {
      loading.value = false;
    }
  };

  // Load single story
  const loadStory = async (storyId: string) => {
    loading.value = true;
    error.value = null;

    try {
      selectedStory.value = await service.getFullSTARStory(storyId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load story';
      console.error('[useStoryEngine] Error:', err);
    } finally {
      loading.value = false;
    }
  };

  // Create story draft from experience
  const createStoryDraft = (experience: Experience) => {
    const sourceText = [
      experience.title,
      experience.companyName,
      ...(experience.responsibilities || []),
      ...(experience.tasks || []),
      experience.rawText,
    ]
      .filter(Boolean)
      .join('\n');

    draftStory.value = {
      situation: '',
      task: '',
      action: '',
      result: '',
      achievements: [],
      kpiSuggestions: [],
      experienceId: experience.id,
    };

    return sourceText;
  };

  // Generate STAR from text
  const runStarInterview = async (sourceText: string) => {
    if (!sourceText?.trim()) {
      error.value = 'Source text is required';
      return;
    }

    generating.value = true;
    error.value = null;

    try {
      const aiStories = await service.generateStar(sourceText);

      // Take the first story from the array (AI may generate multiple)
      const aiStory = aiStories[0];

      if (draftStory.value) {
        Object.assign(draftStory.value, {
          situation: aiStory.situation,
          task: aiStory.task,
          action: aiStory.action,
          result: aiStory.result,
        });
      } else {
        draftStory.value = {
          ...aiStory,
          achievements: [],
          kpiSuggestions: [],
        };
      }

      // Automatically generate achievements and KPIs for the generated story
      try {
        const achievements = await service.generateAchievements(aiStory);
        generatedAchievements.value = achievements;

        if (draftStory.value) {
          draftStory.value.achievements = achievements.achievements || [];
          draftStory.value.kpiSuggestions = achievements.kpiSuggestions || [];
        }
      } catch (achievementsErr) {
        console.error('[useStoryEngine] Failed to auto-generate achievements:', achievementsErr);
        // Don't throw - story generation succeeded, achievements are optional
      }

      return aiStory;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate STAR';
      console.error('[useStoryEngine] Error:', err);
      throw err;
    } finally {
      generating.value = false;
    }
  };

  // Generate achievements
  const generateAchievements = async (story?: STARStory | StoryDraft) => {
    const sourceStory = story || draftStory.value || selectedStory.value;
    if (!sourceStory) {
      error.value = 'No story available';
      return;
    }

    generating.value = true;
    error.value = null;

    try {
      const aiStory: AiSTARStory = {
        situation: sourceStory.situation,
        task: sourceStory.task,
        action: sourceStory.action,
        result: sourceStory.result,
      };

      const achievements = await service.generateAchievements(aiStory);
      generatedAchievements.value = achievements;

      if (draftStory.value) {
        draftStory.value.achievements = achievements.achievements || [];
        draftStory.value.kpiSuggestions = achievements.kpiSuggestions || [];
      }

      return achievements;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate achievements';
      console.error('[useStoryEngine] Error:', err);
      throw err;
    } finally {
      generating.value = false;
    }
  };

  // Save draft as new story
  const saveStory = async (expId?: string) => {
    if (!draftStory.value) {
      error.value = 'No draft to save';
      return null;
    }

    const targetExpId = getExperienceId(expId);
    if (!targetExpId) {
      error.value = 'Experience ID required';
      return null;
    }

    saving.value = true;
    error.value = null;

    try {
      const aiStory: AiSTARStory = {
        situation: draftStory.value.situation,
        task: draftStory.value.task,
        action: draftStory.value.action,
        result: draftStory.value.result,
      };

      const achievements: AchievementsAndKpis | undefined = generatedAchievements.value
        ? {
            achievements: draftStory.value.achievements,
            kpiSuggestions: draftStory.value.kpiSuggestions,
          }
        : undefined;

      const newStory = await service.createAndLinkStory(aiStory, targetExpId, achievements);

      if (newStory) {
        stories.value.push(newStory);
        selectedStory.value = newStory;
        draftStory.value = null;
        generatedAchievements.value = null;
      }

      return newStory;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save story';
      console.error('[useStoryEngine] Error:', err);
      return null;
    } finally {
      saving.value = false;
    }
  };

  // Update existing story
  const updateStory = async (
    storyId: string,
    updates: Partial<Omit<STARStory, 'id' | 'experienceId' | 'owner' | 'createdAt' | 'updatedAt'>>
  ) => {
    saving.value = true;
    error.value = null;

    try {
      const updated = await service.updateStory(storyId, updates);

      if (updated) {
        const index = stories.value.findIndex((s) => s.id === storyId);
        if (index !== -1) stories.value[index] = updated;
        if (selectedStory.value?.id === storyId) selectedStory.value = updated;
      }

      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update story';
      console.error('[useStoryEngine] Error:', err);
      return null;
    } finally {
      saving.value = false;
    }
  };

  // Delete story
  const deleteStory = async (storyId: string) => {
    saving.value = true;
    error.value = null;

    try {
      await service.deleteStory(storyId);
      stories.value = stories.value.filter((s) => s.id !== storyId);
      if (selectedStory.value?.id === storyId) selectedStory.value = null;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete story';
      console.error('[useStoryEngine] Error:', err);
      return false;
    } finally {
      saving.value = false;
    }
  };

  // Update draft fields
  const updateDraft = (updates: Partial<StoryDraft>) => {
    if (draftStory.value) {
      draftStory.value = { ...draftStory.value, ...updates };
    }
  };

  // Clear draft
  const clearDraft = () => {
    draftStory.value = null;
    generatedAchievements.value = null;
  };

  // Reset all state
  const reset = () => {
    stories.value = [];
    selectedStory.value = null;
    draftStory.value = null;
    generatedAchievements.value = null;
    error.value = null;
    loading.value = false;
    saving.value = false;
    generating.value = false;
  };

  return {
    // State
    stories,
    selectedStory,
    draftStory,
    generatedAchievements,
    loading,
    saving,
    generating,
    error,

    // Computed
    hasStories,
    hasDraft,
    isGenerating,

    // Actions
    loadStories,
    loadStory,
    createStoryDraft,
    runStarInterview,
    generateAchievements,
    saveStory,
    updateStory,
    deleteStory,
    updateDraft,
    clearDraft,
    reset,
  };
}
