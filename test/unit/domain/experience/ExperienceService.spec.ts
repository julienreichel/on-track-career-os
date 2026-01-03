import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';

// Mock the repositories
vi.mock('@/domain/experience/ExperienceRepository');
vi.mock('@/domain/starstory/STARStoryService');

describe('ExperienceService', () => {
  let service: ExperienceService;
  let mockRepository: ReturnType<typeof vi.mocked<ExperienceRepository>>;
  let mockStarStoryService: ReturnType<typeof vi.mocked<STARStoryService>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<ExperienceRepository>>;

    mockStarStoryService = {
      getStoriesByExperience: vi.fn(),
      deleteStory: vi.fn(),
      getFullSTARStory: vi.fn(),
      getAllStories: vi.fn(),
      generateStar: vi.fn(),
      generateAchievements: vi.fn(),
      createAndLinkStory: vi.fn(),
      updateStory: vi.fn(),
      linkStoryToExperience: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<STARStoryService>>;

    service = new ExperienceService({
      repo: mockRepository,
      starStoryService: mockStarStoryService,
    });
  });

  describe('getFullExperience', () => {
    it('should fetch a complete Experience by id', async () => {
      const mockExperience = {
        id: 'experience-123',
        title: 'Senior Software Engineer',
        companyName: 'TechCorp Inc.',
        startDate: '2020-01-15',
        endDate: '2023-12-31',
        responsibilities: ['Lead development team', 'Architecture design'],
        tasks: ['Code review', 'Sprint planning'],
        rawText: 'Senior Software Engineer at TechCorp...',
        status: 'complete',
        userId: 'user-123',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as Experience;

      mockRepository.get.mockResolvedValue(mockExperience);

      const result = await service.getFullExperience('experience-123');

      expect(mockRepository.get).toHaveBeenCalledWith('experience-123');
      expect(result).toEqual(mockExperience);
    });

    it('should return null when Experience does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullExperience('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('list operations', () => {
    it('should list all experiences for a user', async () => {
      const mockExperiences = [
        {
          id: 'exp-1',
          title: 'Software Engineer',
          companyName: 'Company A',
          startDate: '2018-01-01',
          endDate: '2020-12-31',
          userId: 'user-123',
          status: 'complete',
        },
        {
          id: 'exp-2',
          title: 'Senior Engineer',
          companyName: 'Company B',
          startDate: '2021-01-01',
          endDate: null,
          userId: 'user-123',
          status: 'draft',
        },
      ] as Experience[];

      mockRepository.list.mockResolvedValue(mockExperiences);

      const result = await mockRepository.list();

      expect(mockRepository.list).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockExperiences);
    });
  });

  describe('create operations', () => {
    it('should create a new experience', async () => {
      const newExperience = {
        title: 'Junior Developer',
        companyName: 'StartupXYZ',
        startDate: '2023-06-01',
        userId: 'user-123',
        status: 'draft',
      };

      const createdExperience = {
        id: 'exp-new',
        ...newExperience,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as Experience;

      mockRepository.create.mockResolvedValue(createdExperience);

      const result = await mockRepository.create(newExperience as any);

      expect(mockRepository.create).toHaveBeenCalledWith(newExperience);
      expect(result).toEqual(createdExperience);
    });
  });

  describe('deleteExperience', () => {
    it('should cascade delete associated STAR stories and then delete the experience', async () => {
      const experienceId = 'exp-123';
      const mockStories: STARStory[] = [
        {
          id: 'story-1',
          title: 'Story 1',
          situation: 'Situation',
          task: 'Task',
          action: 'Action',
          result: 'Result',
          experienceId,
          userId: 'user-123',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          owner: 'user-123::user-123',
        } as STARStory,
        {
          id: 'story-2',
          title: 'Story 2',
          situation: 'Situation',
          task: 'Task',
          action: 'Action',
          result: 'Result',
          experienceId,
          userId: 'user-123',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          owner: 'user-123::user-123',
        } as STARStory,
      ];

      mockStarStoryService.getStoriesByExperience.mockResolvedValue(mockStories);
      mockStarStoryService.deleteStory.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteExperience(experienceId);

      expect(mockStarStoryService.getStoriesByExperience).toHaveBeenCalledWith(experienceId);
      expect(mockStarStoryService.deleteStory).toHaveBeenCalledTimes(2);
      expect(mockStarStoryService.deleteStory).toHaveBeenCalledWith('story-1');
      expect(mockStarStoryService.deleteStory).toHaveBeenCalledWith('story-2');
      expect(mockRepository.delete).toHaveBeenCalledWith(experienceId);
    });

    it('should delete experience even when no STAR stories exist', async () => {
      const experienceId = 'exp-456';

      mockStarStoryService.getStoriesByExperience.mockResolvedValue([]);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteExperience(experienceId);

      expect(mockStarStoryService.getStoriesByExperience).toHaveBeenCalledWith(experienceId);
      expect(mockStarStoryService.deleteStory).not.toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith(experienceId);
    });

    it('should throw error when experienceId is not provided', async () => {
      await expect(service.deleteExperience('')).rejects.toThrow('Experience ID is required');

      expect(mockStarStoryService.getStoriesByExperience).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
