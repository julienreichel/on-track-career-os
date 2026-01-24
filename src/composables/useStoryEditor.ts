import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory, STARStoryUpdateInput } from '@/domain/starstory/STARStory';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import { useAnalytics } from '@/composables/useAnalytics';

/**
 * Story Editor Form State
 */
export interface StoryFormState {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  achievements: string[];
  kpiSuggestions: string[];
  experienceId?: string;
}

/**
 * Create empty form state
 */
function createEmptyFormState(): StoryFormState {
  return {
    title: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    achievements: [],
    kpiSuggestions: [],
  };
}

/**
 * Convert story to form state
 */
function storyToFormState(story: STARStory): StoryFormState {
  return {
    title: story.title || '',
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    achievements: (story.achievements || []).filter((a): a is string => a !== null),
    kpiSuggestions: (story.kpiSuggestions || []).filter((k): k is string => k !== null),
    experienceId: story.experienceId,
  };
}

/**
 * Validate form state for saving
 */
function isFormValid(form: StoryFormState): boolean {
  return (
    form.title.trim().length > 0 &&
    form.situation.trim().length > 0 &&
    form.task.trim().length > 0 &&
    form.action.trim().length > 0 &&
    form.result.trim().length > 0
  );
}

/**
 * Convert form state to AI story format
 */
function formStateToAiStory(form: StoryFormState): AiSTARStory {
  return {
    title: form.title,
    situation: form.situation,
    task: form.task,
    action: form.action,
    result: form.result,
  };
}

/**
 * Extract achievements and KPIs from form state
 */
function extractEnhancements(form: StoryFormState): AchievementsAndKpis {
  return {
    achievements: form.achievements,
    kpiSuggestions: form.kpiSuggestions,
  };
}

/**
 * Create story updates object
 */
function createStoryUpdates(form: StoryFormState): Partial<Omit<STARStoryUpdateInput, 'id'>> {
  return {
    title: form.title,
    situation: form.situation,
    task: form.task,
    action: form.action,
    result: form.result,
    achievements: form.achievements,
    kpiSuggestions: form.kpiSuggestions,
  };
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
// eslint-disable-next-line max-lines-per-function
export function useStoryEditor(storyId?: string) {
  const story = ref<STARStory | null>(null);
  const formState = ref<StoryFormState>(createEmptyFormState());
  const isDirty = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

  const isNewStory = computed(() => !story.value?.id);
  const canSave = computed(() => isDirty.value && isFormValid(formState.value));

  const load = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      story.value = await service.getFullSTARStory(id);
      if (story.value) {
        formState.value = storyToFormState(story.value);
        isDirty.value = false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.loadFailed';
    } finally {
      loading.value = false;
    }
  };

  const initializeNew = (data?: Partial<StoryFormState>) => {
    story.value = null;
    formState.value = { ...createEmptyFormState(), ...data };
    isDirty.value = !!data;
  };

  const updateField = (field: keyof StoryFormState, value: string | string[] | undefined) => {
    if (field === 'achievements' || field === 'kpiSuggestions') {
      formState.value[field] = (value as string[] | undefined) ?? [];
    } else {
      formState.value[field] = (value as string | undefined) ?? '';
    }
    isDirty.value = true;
  };

  const save = async (experienceId?: string) => {
    const targetExpId = experienceId || formState.value.experienceId;
    if (!canSave.value || !targetExpId) {
      error.value = !canSave.value
        ? 'storyEditor.errors.invalidForm'
        : 'storyEditor.errors.missingExperienceId';
      return null;
    }

    saving.value = true;
    error.value = null;
    const { captureEvent } = useAnalytics();
    
    try {
      if (isNewStory.value) {
        const aiStory = formStateToAiStory(formState.value);
        const achievements = extractEnhancements(formState.value);
        story.value = await service.createAndLinkStory(aiStory, targetExpId, achievements);
        
        // Track story creation - determine if it was from experience or free text
        const isFromExperience = Boolean(targetExpId);
        captureEvent(
          isFromExperience ? 'story_created_from_experience' : 'story_created_from_free_text'
        );
      } else {
        story.value = await service.updateStory(
          story.value!.id,
          createStoryUpdates(formState.value)
        );
      }
      if (story.value) {
        isDirty.value = false;
      }
      return story.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.saveFailed';
      return null;
    } finally {
      saving.value = false;
    }
  };

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
      formState.value = createEmptyFormState();
      isDirty.value = false;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyEditor.errors.deleteFailed';
      return false;
    } finally {
      deleting.value = false;
    }
  };

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
      return null;
    } finally {
      saving.value = false;
    }
  };

  const discard = () => (story.value?.id ? load(story.value.id) : initializeNew());

  const reset = () => {
    Object.assign(
      { story, formState, isDirty, error, loading, saving, deleting },
      {
        story: null,
        formState: createEmptyFormState(),
        isDirty: false,
        error: null,
        loading: false,
        saving: false,
        deleting: false,
      }
    );
  };

  if (storyId) void load(storyId);

  return {
    story,
    formState,
    isDirty,
    loading,
    saving,
    deleting,
    error,
    isNewStory,
    canSave,
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
