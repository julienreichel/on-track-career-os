import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStoryRepository } from '@/domain/starstory/STARStoryRepository';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { STARStory as AiSTARStory } from '@/domain/ai-operations/STARStory';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

// Mock the dependencies
vi.mock('@/domain/starstory/STARStoryRepository');
vi.mock('@/domain/ai-operations/AiOperationsService');

describe('STARStoryService', () => {
  let service: STARStoryService;
  let mockRepository: ReturnType<typeof vi.mocked<STARStoryRepository>>;
  let mockAiService: ReturnType<typeof vi.mocked<AiOperationsService>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getStoriesByExperience: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<STARStoryRepository>>;

    mockAiService = {
      generateStarStory: vi.fn(),
      generateAchievementsAndKpis: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<AiOperationsService>>;

    service = new STARStoryService(mockRepository, mockAiService);
  });

  describe('getFullSTARStory', () => {
    it('should fetch a complete STARStory by id', async () => {
      const mockSTARStory = {
        id: 'starstory-123',
        situation: 'The team was struggling with deployment bottlenecks',
        task: 'Improve deployment efficiency',
        action: 'Led migration to microservices architecture',
        result: 'Reduced deployment time by 70%',
        achievements: ['Led successful migration', 'Reduced deployment time'],
        kpiSuggestions: ['Deployment time: 70% reduction', 'System uptime: 99.9%'],
        experienceId: 'exp-456',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as STARStory;

      mockRepository.get.mockResolvedValue(mockSTARStory);

      const result = await service.getFullSTARStory('starstory-123');

      expect(mockRepository.get).toHaveBeenCalledWith('starstory-123');
      expect(result).toEqual(mockSTARStory);
    });

    it('should return null when STARStory does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullSTARStory('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockRepository.get.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getFullSTARStory('starstory-123')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getStoriesByExperience', () => {
    it('should fetch all stories for an experience', async () => {
      const mockStories: STARStory[] = [
        { id: 'story-1', situation: 'S1', task: 'T1', action: 'A1', result: 'R1', experienceId: 'exp-123' },
        { id: 'story-2', situation: 'S2', task: 'T2', action: 'A2', result: 'R2', experienceId: 'exp-123' },
      ] as STARStory[];

      mockRepository.getStoriesByExperience.mockResolvedValue(mockStories);

      const result = await service.getStoriesByExperience('exp-123');

      expect(mockRepository.getStoriesByExperience).toHaveBeenCalledWith('exp-123');
      expect(result).toEqual(mockStories);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when experience has no stories', async () => {
      mockRepository.getStoriesByExperience.mockResolvedValue([]);

      const result = await service.getStoriesByExperience('exp-no-stories');

      expect(result).toEqual([]);
    });
  });

  describe('generateStar', () => {
    it('should generate STAR story from source text', async () => {
      const sourceText = 'Led team migration to microservices...';
      const mockAiStory: AiSTARStory = {
        situation: 'Team struggled with monolithic architecture',
        task: 'Migrate to microservices',
        action: 'Led the migration process',
        result: 'Improved scalability and deployment speed',
      };

      mockAiService.generateStarStory.mockResolvedValue(mockAiStory);

      const result = await service.generateStar(sourceText);

      expect(mockAiService.generateStarStory).toHaveBeenCalledWith(sourceText);
      expect(result).toEqual(mockAiStory);
    });

    it('should throw error for empty source text', async () => {
      await expect(service.generateStar('')).rejects.toThrow('Source text cannot be empty');
      expect(mockAiService.generateStarStory).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only source text', async () => {
      await expect(service.generateStar('   ')).rejects.toThrow('Source text cannot be empty');
    });
  });

  describe('generateAchievements', () => {
    it('should generate achievements and KPIs from STAR story', async () => {
      const aiStory: AiSTARStory = {
        situation: 'System performance issues',
        task: 'Optimize performance',
        action: 'Refactored codebase',
        result: 'Improved response time by 60%',
      };

      const mockAchievements: AchievementsAndKpis = {
        achievements: ['Improved system performance', 'Led optimization initiative'],
        kpiSuggestions: ['Response time: 60% improvement', 'User satisfaction: 40% increase'],
      };

      mockAiService.generateAchievementsAndKpis.mockResolvedValue(mockAchievements);

      const result = await service.generateAchievements(aiStory);

      expect(mockAiService.generateAchievementsAndKpis).toHaveBeenCalledWith(aiStory);
      expect(result).toEqual(mockAchievements);
    });
  });

  describe('createAndLinkStory', () => {
    it('should create story and link to experience', async () => {
      const storyData: AiSTARStory = {
        situation: 'Performance bottleneck',
        task: 'Optimize query performance',
        action: 'Redesigned database indexes',
        result: '80% faster queries',
      };

      const mockCreatedStory: STARStory = {
        id: 'story-new',
        ...storyData,
        experienceId: 'exp-123',
        achievements: [],
        kpiSuggestions: [],
      } as STARStory;

      mockRepository.create.mockResolvedValue(mockCreatedStory);

      const result = await service.createAndLinkStory(storyData, 'exp-123');

      expect(mockRepository.create).toHaveBeenCalledWith({
        situation: storyData.situation,
        task: storyData.task,
        action: storyData.action,
        result: storyData.result,
        experienceId: 'exp-123',
        achievements: [],
        kpiSuggestions: [],
      });
      expect(result).toEqual(mockCreatedStory);
    });

    it('should include achievements when provided', async () => {
      const storyData: AiSTARStory = {
        situation: 'S',
        task: 'T',
        action: 'A',
        result: 'R',
      };

      const achievements: AchievementsAndKpis = {
        achievements: ['Achievement 1', 'Achievement 2'],
        kpiSuggestions: ['KPI 1', 'KPI 2'],
      };

      mockRepository.create.mockResolvedValue({ id: 'story-123' } as STARStory);

      await service.createAndLinkStory(storyData, 'exp-456', achievements);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          achievements: ['Achievement 1', 'Achievement 2'],
          kpiSuggestions: ['KPI 1', 'KPI 2'],
        })
      );
    });
  });

  describe('updateStory', () => {
    it('should update story with partial changes', async () => {
      const mockUpdatedStory: STARStory = {
        id: 'story-123',
        situation: 'Updated situation',
        task: 'Original task',
        action: 'Original action',
        result: 'Original result',
      } as STARStory;

      mockRepository.update.mockResolvedValue(mockUpdatedStory);

      const result = await service.updateStory('story-123', { situation: 'Updated situation' });

      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'story-123',
        situation: 'Updated situation',
      });
      expect(result).toEqual(mockUpdatedStory);
    });

    it('should return null if update fails', async () => {
      mockRepository.update.mockResolvedValue(null);

      const result = await service.updateStory('story-123', { task: 'New task' });

      expect(result).toBeNull();
    });
  });

  describe('deleteStory', () => {
    it('should delete a story', async () => {
      mockRepository.delete.mockResolvedValue();

      await service.deleteStory('story-123');

      expect(mockRepository.delete).toHaveBeenCalledWith('story-123');
    });
  });

  describe('linkStoryToExperience', () => {
    it('should update story experienceId', async () => {
      const mockUpdatedStory: STARStory = {
        id: 'story-123',
        experienceId: 'exp-new',
      } as STARStory;

      mockRepository.update.mockResolvedValue(mockUpdatedStory);

      const result = await service.linkStoryToExperience('story-123', 'exp-new');

      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'story-123',
        experienceId: 'exp-new',
      });
      expect(result?.experienceId).toBe('exp-new');
    });
  });
});
