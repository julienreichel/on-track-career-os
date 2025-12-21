import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobRoleCardService } from '@/domain/job-role-card/JobRoleCardService';
import type { JobRoleCardRepository } from '@/domain/job-role-card/JobRoleCardRepository';
import type { JobRoleCard } from '@/domain/job-role-card/JobRoleCard';

// Mock the repository
vi.mock('@/domain/job-role-card/JobRoleCardRepository');

describe('JobRoleCardService', () => {
  let service: JobRoleCardService;
  let mockRepository: ReturnType<typeof vi.mocked<JobRoleCardRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<JobRoleCardRepository>>;

    service = new JobRoleCardService(mockRepository);
  });

  describe('getFullJobRoleCard', () => {
    it('should fetch a complete JobRoleCard by id', async () => {
      const mockJobRoleCard = {
        id: 'jobrolecard-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as JobRoleCard;

      mockRepository.get.mockResolvedValue(mockJobRoleCard);

      const result = await service.getFullJobRoleCard('jobrolecard-123');

      expect(mockRepository.get).toHaveBeenCalledWith('jobrolecard-123');
      expect(result).toEqual(mockJobRoleCard);
    });

    it('should return null when JobRoleCard does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullJobRoleCard('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    // TODO: Add more tests for lazy loading and relations
  });
});
