import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStoryRepository } from '@/domain/starstory/STARStoryRepository';
import type { STARStory } from '@/domain/starstory/STARStory';

// Mock the repository
vi.mock('@/domain/starstory/STARStoryRepository');

describe('STARStoryService', () => {
  let service: STARStoryService;
  let mockRepository: ReturnType<typeof vi.mocked<STARStoryRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<STARStoryRepository>>;

    service = new STARStoryService(mockRepository);
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
});
