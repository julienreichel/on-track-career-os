import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory, STARStoryUpdateInput } from '@/domain/starstory/STARStory';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

/**
 * Story Editor Form State
 */
export interface StoryFormState {
  situation: string;
  task: string;
  action: string;
  result: string;
  achievements: string[];
  kpiSuggestions: string[];
  experienceId?: string;
}

/**
 * useStoryEditor Composable
 *
 * Manages single STAR story editing:
 * - Load existing story
 * - Create new story
 * - Update story fields
 * - Save changes
 * - Delete story
 * - Link to experience
 */
export function useStoryEditor(storyId?: string) {
  // State
  const story = ref<STARStory | null>(null);
  const formState = ref<StoryFormState>({
    situation: '',
    task: '',
    action: '',
    result: '',
    achievements: [],
    kpiSuggestions: [],
  });
  const isDirty = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

  // Computed
  const isNewStory = computed(() => !story.value?.id);
  const canSave = computed(() => {
    return (
      isDirty.value &&
      formState.value.situation.trim().length > 0 &&
      formState.value.task.trim().length > 0 &&
      formState.value.action.trim().length > 0 &&
      formState.value.result.trim().length > 0
    );
  });

  /**
   * Load story by ID
   */
  const load = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      story.value = await service.getFullSTARStory(id);

      if (story.value) {
        formState.value = {
          situation: story.value.situation,
          task: story.value.task,
          action: story.value.action,
          result: story.value.result,
          achievements: [...(story.value.achievements || [])],
          kpiSuggestions: [...(story.value.kpiSuggestions || [])],
          experienceId: story.value.experienceId,
        };
        isDirty.value = false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.loadFailed';
      console.error('[useStoryEditor] Load error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Initialize new story with optional data
   */
  const initializeNew = (data?: Partial<StoryFormState>) => {
    story.value = null;
    formState.value = {
      situation: data?.situation || '',
      task: data?.task || '',
      action: data?.action || '',
      result: data?.result || '',
      achievements: data?.achievements || [],
      kpiSuggestions: data?.kpiSuggestions || [],
      experienceId: data?.experienceId,
    };
    isDirty.value = !!data;
  };

  /**
   * Update form field
   */
  const updateField = (field: keyof StoryFormState, value: string | string[] | undefined) => {
    (formState.value[field] as string | string[] | undefined) = value;
    isDirty.value = true;
  };

  /**
   * Save story (create or update)
   */
  const save = async (experienceId?: string) => {
    if (!canSave.value) {
      error.value = 'storyEditor.errors.invalidForm';
      return null;
    }

    const targetExpId = experienceId || formState.value.experienceId;
    if (!targetExpId) {
      error.value = 'storyEditor.errors.missingExperienceId';
      return null;
    }

    saving.value = true;
    error.value = null;

    try {
      if (isNewStory.value) {
        // Create new story
        const aiStory: AiSTARStory = {
          situation: formState.value.situation,
          task: formState.value.task,
          action: formState.value.action,
          result: formState.value.result,
        };

        const achievements: AchievementsAndKpis = {
          achievements: formState.value.achievements,
          kpiSuggestions: formState.value.kpiSuggestions,
        };

        story.value = await service.createAndLinkStory(aiStory, targetExpId, achievements);
      } else {
        // Update existing story
        const updates: Partial<Omit<STARStoryUpdateInput, 'id'>> = {
          situation: formState.value.situation,
          task: formState.value.task,
          action: formState.value.action,
          result: formState.value.result,
          achievements: formState.value.achievements,
          kpiSuggestions: formState.value.kpiSuggestions,
        };

        story.value = await service.updateStory(story.value!.id, updates);
      }

      if (story.value) {
        isDirty.value = false;
      }

      return story.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.saveFailed';
      console.error('[useStoryEditor] Save error:', err);
      return null;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Delete current story
   */
  const deleteStory = async () => {
    if (!story.value?.id) {
      error.value = 'storyEditor.errors.noStoryToDelete';
      return false;
    }

    deleting.value = true;
    error.value = null;

    try {
      await service.deleteStory(story.value.id);
      story.value = null;
      formState.value = {
        situation: '',
        task: '',
        action: '',
        result: '',
        achievements: [],
        kpiSuggestions: [],
      };
      isDirty.value = false;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.deleteFailed';
      console.error('[useStoryEditor] Delete error:', err);
      return false;
    } finally {
      deleting.value = false;
    }
  };

  /**
   * Link story to different experience
   */
  const linkToExperience = async (experienceId: string) => {
    if (!story.value?.id) {
      error.value = 'storyEditor.errors.noStoryToLink';
      return null;
    }

    saving.value = true;
    error.value = null;

    try {
      story.value = await service.linkStoryToExperience(story.value.id, experienceId);
      if (story.value) {
        formState.value.experienceId = experienceId;
        isDirty.value = false;
      }
      return story.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.linkFailed';
      console.error('[useStoryEditor] Link error:', err);
      return null;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Discard changes and reload
   */
  const discard = async () => {
    if (story.value?.id) {
      await load(story.value.id);
    } else {
      initializeNew();
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    story.value = null;
    formState.value = {
      situation: '',
      task: '',
      action: '',
      result: '',
      achievements: [],
      kpiSuggestions: [],
    };
    isDirty.value = false;
    error.value = null;
    loading.value = false;
    saving.value = false;
    deleting.value = false;
  };

  // Auto-load if storyId provided
  if (storyId) {
    load(storyId);
  }

  return {
    // State
    story,
    formState,
    isDirty,
    loading,
    saving,
    deleting,
    error,

    // Computed
    isNewStory,
    canSave,

    // Actions
    load,
    initializeNew,
    updateField,
    save,
    deleteStory,
    linkToExperience,
    discard,
    reset,
  };
}
