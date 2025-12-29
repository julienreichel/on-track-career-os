import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescriptionRepository } from '@/domain/job-description/JobDescriptionRepository';
import type {
  JobDescription,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';

// Mock the repository
vi.mock('@/domain/job-description/JobDescriptionRepository');
vi.mock('@/domain/ai-operations/AiOperationsService');

describe('JobDescriptionService', () => {
  let service: JobDescriptionService;
  let mockRepository: ReturnType<typeof vi.mocked<JobDescriptionRepository>>;
  let mockAiService: ReturnType<typeof vi.mocked<AiOperationsService>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<JobDescriptionRepository>>;
    mockAiService = {
      parseJobDescription: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<AiOperationsService>>;

    service = new JobDescriptionService(mockRepository, mockAiService);
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

  describe('listJobs', () => {
    it('should return list of jobs from repository', async () => {
      const mockJobs = [
        { id: '1', title: 'A' },
        { id: '2', title: 'B' },
      ] as JobDescription[];
      mockRepository.list.mockResolvedValue(mockJobs);

      const result = await service.listJobs();

      expect(mockRepository.list).toHaveBeenCalled();
      expect(result).toEqual(mockJobs);
    });
  });

  describe('createJobFromRawText', () => {
    it('should create a draft job from raw text', async () => {
      const mockCreated = {
        id: 'job-1',
        title: 'Job description pending analysis',
        status: 'draft',
      } as JobDescription;
      mockRepository.create.mockResolvedValue(mockCreated);

      const result = await service.createJobFromRawText('   Job text  ');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rawText: 'Job text',
          status: 'draft',
        })
      );
      expect(result).toEqual(mockCreated);
    });

    it('should throw when raw text empty', async () => {
      await expect(service.createJobFromRawText('  ')).rejects.toThrow(
        'Job description text cannot be empty'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when repository fails to create', async () => {
      mockRepository.create.mockResolvedValue(null);

      await expect(service.createJobFromRawText('Job text')).rejects.toThrow(
        'Failed to create job description'
      );
    });
  });

  describe('updateJob', () => {
    it('should throw when patch empty', async () => {
      await expect(service.updateJob('job-1', {})).rejects.toThrow('No updates provided');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update job using repository', async () => {
      const mockUpdated = { id: 'job-1', title: 'Updated' } as JobDescription;
      mockRepository.update.mockResolvedValue(mockUpdated);

      const patch: Partial<JobDescriptionUpdateInput> = { title: 'Updated' };
      const result = await service.updateJob('job-1', patch);

      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'job-1',
          title: 'Updated',
        })
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('attachParsedJobDescription', () => {
    it('should update job with parsed AI data', async () => {
      const parsed = {
        title: 'New title',
        seniorityLevel: 'Senior',
        roleSummary: 'Summary',
        responsibilities: ['Do things'],
        requiredSkills: ['Skill'],
        behaviours: ['Ownership'],
        successCriteria: ['Goal'],
        explicitPains: ['Pain'],
      } as ParsedJobDescription;

      const mockUpdated = { id: 'job-1', ...parsed, status: 'analyzed' } as JobDescription;
      mockRepository.update.mockResolvedValue(mockUpdated);

      const result = await service.attachParsedJobDescription('job-1', parsed);

      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'job-1',
          title: parsed.title,
          status: 'analyzed',
        })
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('reanalyseJob', () => {
    it('should throw when job not found', async () => {
      mockRepository.get.mockResolvedValue(null);

      await expect(service.reanalyseJob('missing')).rejects.toThrow('Job description not found');
      expect(mockAiService.parseJobDescription).not.toHaveBeenCalled();
    });

    it('should throw when rawText missing', async () => {
      mockRepository.get.mockResolvedValue({ id: 'job-1', rawText: '' } as JobDescription);

      await expect(service.reanalyseJob('job-1')).rejects.toThrow(
        'Job description has no raw text to analyse'
      );
    });

    it('should parse job and update', async () => {
      const job = { id: 'job-1', rawText: 'Job text' } as JobDescription;
      const parsed = {
        title: 'Parsed',
        seniorityLevel: '',
        roleSummary: '',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
      } as ParsedJobDescription;
      const updatedJob = { ...job, title: 'Parsed' } as JobDescription;

      mockRepository.get.mockResolvedValue(job);
      mockAiService.parseJobDescription.mockResolvedValue(parsed);
      mockRepository.update.mockResolvedValue(updatedJob);

      const result = await service.reanalyseJob('job-1');

      expect(mockAiService.parseJobDescription).toHaveBeenCalledWith('Job text');
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedJob);
    });
  });

  describe('deleteJob', () => {
    it('should call repository delete', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteJob('job-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('job-1');
    });
  });
});
