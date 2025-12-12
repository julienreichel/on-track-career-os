import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

/**
 * Story with Experience Context
 */
export interface StoryWithExperience extends STARStory {
  experienceName?: string;
}

/**
 * Grouped Stories by Experience
 */
export interface GroupedStories {
  experienceId: string;
  experienceName: string;
  stories: STARStory[];
}

/**
 * useStoryList Composable
 *
 * Manages loading and organizing STAR stories:
 * - Load all user stories
 * - Load stories for specific experience
 * - Group stories by experience
 * - Search and filter capabilities
 */
// eslint-disable-next-line max-lines-per-function -- Composable requires comprehensive interface
export function useStoryList(
  service = new STARStoryService(),
  experienceRepo = new ExperienceRepository()
) {
  // State
  const stories = ref<STARStory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasStories = computed(() => stories.value.length > 0);
  const storyCount = computed(() => stories.value.length);

  /**
   * Load all stories for current user
   */
  const loadAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      stories.value = await service.getAllStories();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyList.errors.loadFailed';
      console.error('[useStoryList] Load error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load stories for a specific experience by ID
   * Fetches the Experience from database first, then loads stories.
   * @param experienceId - Experience ID string
   */
  const loadByExperienceId = async (experienceId: string) => {
    if (!experienceId) {
      error.value = 'storyList.errors.missingExperienceId';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const experience = await experienceRepo.get(experienceId);

      if (!experience) {
        error.value = 'storyList.errors.experienceNotFound';
        stories.value = [];
        loading.value = false;
        return;
      }

      // Delegate to loadForExperience to avoid code duplication
      await loadForExperience(experience);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyList.errors.loadFailed';
      console.error('[useStoryList] Load by experience ID error:', err);
      loading.value = false;
    }
  };

  /**
   * Load stories for a specific experience (when Experience object already available)
   * Use this to avoid refetching the Experience from database.
   * @param experience - Experience object
   */
  const loadForExperience = async (experience: Experience) => {
    if (!experience) {
      error.value = 'storyList.errors.missingExperience';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      stories.value = await service.getStoriesByExperience(experience);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyList.errors.loadFailed';
      console.error('[useStoryList] Load for experience error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Group stories by experience
   * Note: Requires experience data to be loaded separately for names
   */
  const groupByExperience = (): Map<string, STARStory[]> => {
    const grouped = new Map<string, STARStory[]>();

    stories.value.forEach((story) => {
      const expId = story.experienceId || 'unlinked';
      if (!grouped.has(expId)) {
        grouped.set(expId, []);
      }
      grouped.get(expId)!.push(story);
    });

    return grouped;
  };

  /**
   * Search stories by text
   */
  const search = (query: string): STARStory[] => {
    if (!query.trim()) return stories.value;

    const lowerQuery = query.toLowerCase();

    return stories.value.filter(
      (story) =>
        story.situation.toLowerCase().includes(lowerQuery) ||
        story.task.toLowerCase().includes(lowerQuery) ||
        story.action.toLowerCase().includes(lowerQuery) ||
        story.result.toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Filter stories by experience
   */
  const filterByExperience = (experienceId: string): STARStory[] => {
    return stories.value.filter((story) => story.experienceId === experienceId);
  };

  /**
   * Get story by ID from loaded stories
   */
  const getById = (storyId: string): STARStory | undefined => {
    return stories.value.find((story) => story.id === storyId);
  };

  /**
   * Delete a story
   */
  const deleteStory = async (storyId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await service.deleteStory(storyId);
      stories.value = stories.value.filter((story) => story.id !== storyId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyList.errors.deleteFailed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refresh stories (reload current set)
   */
  const refresh = async () => {
    await loadAll();
  };

  /**
   * Reset state
   */
  const reset = () => {
    stories.value = [];
    error.value = null;
    loading.value = false;
  };

  return {
    // State
    stories,
    loading,
    error,

    // Computed
    hasStories,
    storyCount,

    // Actions
    loadAll,
    loadByExperienceId,
    loadForExperience,
    groupByExperience,
    search,
    filterByExperience,
    getById,
    deleteStory,
    refresh,
    reset,
  };
}
