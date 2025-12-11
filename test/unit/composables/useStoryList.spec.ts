import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoryList } from '@/composables/useStoryList';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

// Mock STARStoryService
vi.mock('@/domain/starstory/STARStoryService', () => ({
  STARStoryService: vi.fn(),
}));

describe('useStoryList', () => {
  let mockService: {
    getAllStories: ReturnType<typeof vi.fn>;
    getStoriesByExperience: ReturnType<typeof vi.fn>;
    deleteStory: ReturnType<typeof vi.fn>;
  };

  const mockStories: STARStory[] = [
    {
      id: 'story-1',
      situation: 'Led migration project',
      task: 'Migrate legacy system',
      action: 'Designed new architecture',
      result: 'Reduced deployment time by 85%',
      achievements: ['Improved efficiency'],
      kpiSuggestions: ['85% faster deployments'],
      experienceId: 'exp-1',
      owner: 'user-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'story-2',
      situation: 'Improved team collaboration',
      task: 'Implement new workflow',
      action: 'Introduced daily standups',
      result: 'Team velocity increased',
      achievements: ['Better communication'],
      kpiSuggestions: ['20% faster delivery'],
      experienceId: 'exp-1',
      owner: 'user-1',
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
    {
      id: 'story-3',
      situation: 'Customer complaint',
      task: 'Fix critical bug',
      action: 'Root cause analysis',
      result: 'Bug resolved quickly',
      achievements: ['High customer satisfaction'],
      kpiSuggestions: ['Fixed in 2 hours'],
      experienceId: 'exp-2',
      owner: 'user-1',
      createdAt: '2024-01-03',
      updatedAt: '2024-01-03',
    },
  ];

  beforeEach(() => {
    mockService = {
      getAllStories: vi.fn(),
      getStoriesByExperience: vi.fn(),
      deleteStory: vi.fn(),
    };
    vi.mocked(STARStoryService).mockImplementation(() => mockService as never);
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { stories, loading, error, hasStories, storyCount } = useStoryList();

      expect(stories.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(hasStories.value).toBe(false);
      expect(storyCount.value).toBe(0);
    });
  });

  describe('loadAll', () => {
    it('should load all stories successfully', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, stories, loading, error, hasStories, storyCount } = useStoryList();

      const loadPromise = loadAll();
      expect(loading.value).toBe(true);

      await loadPromise;

      expect(stories.value).toEqual(mockStories);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(hasStories.value).toBe(true);
      expect(storyCount.value).toBe(3);
      expect(mockService.getAllStories).toHaveBeenCalledTimes(1);
    });

    it('should handle load errors', async () => {
      const mockError = new Error('Failed to load stories');
      mockService.getAllStories.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { loadAll, stories, loading, error } = useStoryList();

      await loadAll();

      expect(stories.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBe('Failed to load stories');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadByExperience', () => {
    it('should load stories for specific experience', async () => {
      const experienceStories = mockStories.filter((s) => s.experienceId === 'exp-1');
      mockService.getStoriesByExperience.mockResolvedValue(experienceStories);

      const { loadByExperience, stories, loading } = useStoryList();

      const loadPromise = loadByExperience('exp-1');
      expect(loading.value).toBe(true);

      await loadPromise;

      expect(stories.value).toEqual(experienceStories);
      expect(loading.value).toBe(false);
      expect(mockService.getStoriesByExperience).toHaveBeenCalledWith('exp-1');
    });

    it('should handle missing experience ID', async () => {
      const { loadByExperience, error } = useStoryList();

      await loadByExperience('');

      expect(error.value).toBe('storyList.errors.missingExperienceId');
      expect(mockService.getStoriesByExperience).not.toHaveBeenCalled();
    });

    it('should handle load errors', async () => {
      mockService.getStoriesByExperience.mockRejectedValue(new Error('API error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { loadByExperience, error, loading } = useStoryList();

      await loadByExperience('exp-1');

      expect(loading.value).toBe(false);
      expect(error.value).toBe('API error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('groupByExperience', () => {
    it('should group stories by experience ID', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, groupByExperience } = useStoryList();
      await loadAll();

      const grouped = groupByExperience();

      expect(grouped.size).toBe(2);
      expect(grouped.get('exp-1')).toHaveLength(2);
      expect(grouped.get('exp-2')).toHaveLength(1);
    });

    it('should handle stories without experienceId', async () => {
      const storiesWithUnlinked = [
        ...mockStories,
        {
          ...mockStories[0],
          id: 'story-4',
          experienceId: undefined,
        } as STARStory,
      ];
      mockService.getAllStories.mockResolvedValue(storiesWithUnlinked);

      const { loadAll, groupByExperience } = useStoryList();
      await loadAll();

      const grouped = groupByExperience();

      expect(grouped.has('unlinked')).toBe(true);
      expect(grouped.get('unlinked')).toHaveLength(1);
    });
  });

  describe('search', () => {
    it('should search stories by query text', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, search } = useStoryList();
      await loadAll();

      const results = search('migration');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('story-1');
    });

    it('should search across all STAR fields', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, search } = useStoryList();
      await loadAll();

      // Search situation
      expect(search('collaboration')).toHaveLength(1);
      // Search task
      expect(search('workflow')).toHaveLength(1);
      // Search action
      expect(search('standups')).toHaveLength(1);
      // Search result
      expect(search('velocity')).toHaveLength(1);
    });

    it('should be case-insensitive', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, search } = useStoryList();
      await loadAll();

      expect(search('MIGRATION')).toHaveLength(1);
      expect(search('Migration')).toHaveLength(1);
      expect(search('migration')).toHaveLength(1);
    });

    it('should return all stories for empty query', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, search } = useStoryList();
      await loadAll();

      expect(search('')).toEqual(mockStories);
      expect(search('   ')).toEqual(mockStories);
    });

    it('should return empty array if no matches', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, search } = useStoryList();
      await loadAll();

      expect(search('nonexistent')).toEqual([]);
    });
  });

  describe('filterByExperience', () => {
    it('should filter stories by experience ID', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, filterByExperience } = useStoryList();
      await loadAll();

      const filtered = filterByExperience('exp-1');

      expect(filtered).toHaveLength(2);
      expect(filtered.every((s) => s.experienceId === 'exp-1')).toBe(true);
    });

    it('should return empty array if no matches', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, filterByExperience } = useStoryList();
      await loadAll();

      expect(filterByExperience('exp-999')).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should get story by ID', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, getById } = useStoryList();
      await loadAll();

      const story = getById('story-2');

      expect(story).toBeDefined();
      expect(story?.id).toBe('story-2');
    });

    it('should return undefined if story not found', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, getById } = useStoryList();
      await loadAll();

      expect(getById('story-999')).toBeUndefined();
    });
  });

  describe('refresh', () => {
    it('should reload all stories', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { refresh } = useStoryList();

      await refresh();

      expect(mockService.getAllStories).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteStory', () => {
    it('should delete a story successfully', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);
      mockService.deleteStory.mockResolvedValue(undefined);

      const { loadAll, deleteStory, stories, loading } = useStoryList();
      await loadAll();

      expect(stories.value).toHaveLength(3);

      const deletePromise = deleteStory('story-2');
      expect(loading.value).toBe(true);

      await deletePromise;

      expect(stories.value).toHaveLength(2);
      expect(stories.value.find((s) => s.id === 'story-2')).toBeUndefined();
      expect(loading.value).toBe(false);
      expect(mockService.deleteStory).toHaveBeenCalledWith('story-2');
    });

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed');
      mockService.getAllStories.mockResolvedValue(mockStories);
      mockService.deleteStory.mockRejectedValue(mockError);

      const { loadAll, deleteStory, stories, error } = useStoryList();
      await loadAll();

      await expect(deleteStory('story-1')).rejects.toThrow('Delete failed');

      expect(stories.value).toHaveLength(3);
      expect(error.value).toBe('Delete failed');
    });

    it('should not remove story from list on error', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);
      mockService.deleteStory.mockRejectedValue(new Error('Network error'));

      const { loadAll, deleteStory, stories } = useStoryList();
      await loadAll();

      const originalCount = stories.value.length;

      try {
        await deleteStory('story-1');
      } catch {
        // Expected to throw
      }

      expect(stories.value).toHaveLength(originalCount);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockService.getAllStories.mockResolvedValue(mockStories);

      const { loadAll, reset, stories, loading, error } = useStoryList();

      await loadAll();
      expect(stories.value).toHaveLength(3);

      reset();

      expect(stories.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });
});
