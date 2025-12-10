import { ref, computed } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

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
export function useStoryList() {
  // State
  const stories = ref<STARStory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const service = new STARStoryService();

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
   * Load stories for specific experience
   */
  const loadByExperience = async (experienceId: string) => {
    if (!experienceId) {
      error.value = 'storyList.errors.missingExperienceId';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      stories.value = await service.getStoriesByExperience(experienceId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'storyList.errors.loadFailed';
      console.error('[useStoryList] Load by experience error:', err);
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
    loadByExperience,
    groupByExperience,
    search,
    filterByExperience,
    getById,
    refresh,
    reset,
  };
}
