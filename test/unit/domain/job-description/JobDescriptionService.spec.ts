import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { JobDescriptionRepository } from '@/domain/job-description/JobDescriptionRepository';
import type { JobDescription } from '@/domain/job-description/JobDescription';

// Mock the repository
vi.mock('@/domain/job-description/JobDescriptionRepository');

describe('JobDescriptionService', () => {
  let service: JobDescriptionService;
  let mockRepository: ReturnType<typeof vi.mocked<JobDescriptionRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<JobDescriptionRepository>>;

    service = new JobDescriptionService(mockRepository);
  });

  describe('getFullJobDescription', () => {
    it('should fetch a complete JobDescription by id', async () => {
      const mockJobDescription = {
        id: 'jobdescription-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as JobDescription;

      mockRepository.get.mockResolvedValue(mockJobDescription);

      const result = await service.getFullJobDescription('jobdescription-123');

      expect(mockRepository.get).toHaveBeenCalledWith('jobdescription-123');
      expect(result).toEqual(mockJobDescription);
    });

    it('should return null when JobDescription does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullJobDescription('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    // TODO: Add more tests for lazy loading and relations
  });
});
