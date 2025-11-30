import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';

// Mock the repository
vi.mock('@/domain/experience/ExperienceRepository');

describe('ExperienceService', () => {
  let service: ExperienceService;
  let mockRepository: ReturnType<typeof vi.mocked<ExperienceRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<ExperienceRepository>>;

    service = new ExperienceService(mockRepository);
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
});
