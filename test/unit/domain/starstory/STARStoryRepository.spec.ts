import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  STARStoryRepository,
  type AmplifySTARStoryModel,
} from '@/domain/starstory/STARStoryRepository';
import type {
  STARStoryCreateInput,
  STARStoryUpdateInput,
  STARStory,
} from '@/domain/starstory/STARStory';
import type { AmplifyExperienceModel } from '@/domain/experience/ExperienceRepository';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

describe('STARStoryRepository', () => {
  let repository: STARStoryRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockExperienceModel: {
    get: ReturnType<typeof vi.fn>;
  };
  let mockUserProfileModel: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockExperienceModel = {
      get: vi.fn(),
    };

    mockUserProfileModel = {
      get: vi.fn(),
    };

    // Inject the mocks via constructor (dependency injection)
    repository = new STARStoryRepository(
      mockModel as AmplifySTARStoryModel,
      mockExperienceModel as AmplifyExperienceModel,
      mockUserProfileModel as AmplifyUserProfileModel
    );
  });

  describe('get', () => {
    it('should fetch a STAR story by id', async () => {
      const mockStory: STARStory = {
        id: 'story-123',
        userId: 'user-123',
        experienceId: 'exp-123',
        situation: 'System had performance bottlenecks affecting user experience',
        task: 'Improve system performance and reduce response time by 50%',
        action: 'Analyzed bottlenecks, redesigned caching layer, optimized database queries',
        result: 'Reduced response time by 60%, improved user satisfaction by 40%',
        title: 'Performance Optimization',
        tags: ['performance', 'optimization', 'leadership'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as unknown as STARStory;

      mockModel.get.mockResolvedValue({
        data: mockStory,
      });

      const result = await repository.get('story-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'story-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockStory);
      expect(result?.title).toBe('Performance Optimization');
    });

    it('should return null when story is not found', async () => {
      mockModel.get.mockResolvedValue({
        data: null,
      });

      const result = await repository.get('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllStoriesByUser', () => {
    it('should return empty array when userId is missing', async () => {
      const result = await repository.getAllStoriesByUser('');

      expect(result).toEqual([]);
      expect(mockUserProfileModel.get).not.toHaveBeenCalled();
    });

    it('should fetch all STAR stories via user profile selection set', async () => {
      const storyOne = {
        id: 'story-1',
        userId: 'user-123',
        experienceId: 'exp-1',
        situation: 'Situation 1',
        task: 'Task 1',
        action: 'Action 1',
        result: 'Result 1',
        title: 'Story 1',
        tags: ['tag1'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as unknown as STARStory;
      const storyTwo = {
        id: 'story-2',
        userId: 'user-123',
        experienceId: 'exp-2',
        situation: 'Situation 2',
        task: 'Task 2',
        action: 'Action 2',
        result: 'Result 2',
        title: 'Story 2',
        tags: ['tag2'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as unknown as STARStory;

      mockUserProfileModel.get.mockResolvedValue({
        data: {
          id: 'user-123',
          experiences: [
            {
              id: 'exp-1',
              stories: [storyOne, null],
            },
            null,
            {
              id: 'exp-2',
              stories: [storyTwo],
            },
          ],
        },
      });

      const result = await repository.getAllStoriesByUser('user-123');

      expect(mockUserProfileModel.get).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining([
            'id',
            'experiences.id',
            'experiences.stories.*',
          ]),
        })
      );
      expect(result).toEqual([storyOne, storyTwo]);
    });
  });

  describe('getStoriesByExperience', () => {
    it('should fetch stories for a specific experience using selection set', async () => {
      const mockStories: STARStory[] = [
        {
          id: 'story-1',
          userId: 'user-123',
          experienceId: 'exp-123',
          situation: 'Situation 1',
          task: 'Task 1',
          action: 'Action 1',
          result: 'Result 1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'story-2',
          userId: 'user-123',
          experienceId: 'exp-123',
          situation: 'Situation 2',
          task: 'Task 2',
          action: 'Action 2',
          result: 'Result 2',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ] as unknown as STARStory[];

      mockExperienceModel.get.mockResolvedValue({
        data: {
          id: 'exp-123',
          stories: mockStories,
        },
      });

      const result = await repository.getStoriesByExperience('exp-123');

      expect(mockExperienceModel.get).toHaveBeenCalledWith(
        { id: 'exp-123' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining([expect.stringContaining('stories')]),
        })
      );
      expect(result).toEqual(mockStories);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when experience has no stories', async () => {
      mockExperienceModel.get.mockResolvedValue({
        data: {
          id: 'exp-123',
          stories: [],
        },
      });

      const result = await repository.getStoriesByExperience('exp-123');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new STAR story', async () => {
      const mockInput: STARStoryCreateInput = {
        userId: 'user-123',
        experienceId: 'exp-123',
        situation: 'Team was struggling with deployment issues',
        task: 'Implement CI/CD pipeline to automate deployments',
        action: 'Set up GitHub Actions, configured automated testing, deployed to staging',
        result: 'Reduced deployment time from 2 hours to 15 minutes',
        title: 'CI/CD Implementation',
        tags: ['devops', 'automation', 'ci-cd'],
      } as unknown as STARStoryCreateInput;

      const mockCreatedStory: STARStory = {
        id: 'story-new',
        ...mockInput,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as unknown as STARStory;

      mockModel.create.mockResolvedValue({
        data: mockCreatedStory,
      });

      const result = await repository.create(mockInput);

      expect(mockModel.create).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCreatedStory);
      expect(result?.id).toBe('story-new');
      expect(result?.title).toBe('CI/CD Implementation');
    });

    it('should return null when creation fails', async () => {
      const mockInput: STARStoryCreateInput = {
        userId: 'user-123',
        experienceId: 'exp-123',
        situation: 'Test',
        task: 'Test',
        action: 'Test',
        result: 'Test',
        title: 'Test Story',
        tags: [],
      } as unknown as STARStoryCreateInput;

      mockModel.create.mockResolvedValue({
        data: null,
      });

      const result = await repository.create(mockInput);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing STAR story', async () => {
      const mockInput: STARStoryUpdateInput = {
        id: 'story-123',
        title: 'Updated Title',
        tags: ['updated', 'tags'],
      } as unknown as STARStoryUpdateInput;

      const mockUpdatedStory: STARStory = {
        id: 'story-123',
        userId: 'user-123',
        experienceId: 'exp-123',
        situation: 'Original situation',
        task: 'Original task',
        action: 'Original action',
        result: 'Original result',
        title: 'Updated Title',
        tags: ['updated', 'tags'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      } as unknown as STARStory;

      mockModel.update.mockResolvedValue({
        data: mockUpdatedStory,
      });

      const result = await repository.update(mockInput);

      expect(mockModel.update).toHaveBeenCalledWith(
        mockInput,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUpdatedStory);
      expect(result?.title).toBe('Updated Title');
      expect(result?.tags).toEqual(['updated', 'tags']);
    });

    it('should handle partial updates', async () => {
      const mockInput: STARStoryUpdateInput = {
        id: 'story-123',
        result: 'Updated result with new metrics',
      } as unknown as STARStoryUpdateInput;

      mockModel.update.mockResolvedValue({
        data: {
          id: 'story-123',
          result: 'Updated result with new metrics',
        } as STARStory,
      });

      const result = await repository.update(mockInput);

      expect(result?.result).toBe('Updated result with new metrics');
    });

    it('should update all STAR components', async () => {
      const mockInput: STARStoryUpdateInput = {
        id: 'story-123',
        situation: 'New situation',
        task: 'New task',
        action: 'New action',
        result: 'New result',
      } as unknown as STARStoryUpdateInput;

      mockModel.update.mockResolvedValue({
        data: {
          id: 'story-123',
          ...mockInput,
        } as STARStory,
      });

      const result = await repository.update(mockInput);

      expect(result?.situation).toBe('New situation');
      expect(result?.task).toBe('New task');
      expect(result?.action).toBe('New action');
      expect(result?.result).toBe('New result');
    });
  });

  describe('delete', () => {
    it('should delete a STAR story by id', async () => {
      mockModel.delete.mockResolvedValue({
        data: {
          id: 'story-123',
        } as STARStory,
      });

      await repository.delete('story-123');

      expect(mockModel.delete).toHaveBeenCalledWith(
        { id: 'story-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('should not throw error when deleting non-existent story', async () => {
      mockModel.delete.mockResolvedValue({
        data: null,
      });

      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });
});
