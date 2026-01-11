import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescriptionRepository } from '@/domain/job-description/JobDescriptionRepository';
import type {
  JobDescription,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';
import type { CompanyRepository } from '@/domain/company/CompanyRepository';
import type { CompanyCanvasRepository } from '@/domain/company-canvas/CompanyCanvasRepository';
import type { Company } from '@/domain/company/Company';
import type { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';

// Mock the repository
vi.mock('@/domain/job-description/JobDescriptionRepository');
vi.mock('@/domain/ai-operations/AiOperationsService');
vi.mock('@/domain/company/CompanyRepository');
vi.mock('@/domain/company-canvas/CompanyCanvasRepository');
vi.mock('@/domain/matching-summary/MatchingSummaryService');

describe('JobDescriptionService', () => {
  let service: JobDescriptionService;
  let mockRepository: ReturnType<typeof vi.mocked<JobDescriptionRepository>>;
  let mockAiService: ReturnType<typeof vi.mocked<AiOperationsService>>;
  let mockCompanyRepo: ReturnType<typeof vi.mocked<CompanyRepository>>;
  let mockCanvasRepo: ReturnType<typeof vi.mocked<CompanyCanvasRepository>>;
  let mockMatchingSummaryService: ReturnType<typeof vi.mocked<MatchingSummaryService>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      getWithRelations: vi.fn(),
      listByOwner: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<JobDescriptionRepository>>;
    mockAiService = {
      parseJobDescription: vi.fn(),
      analyzeCompanyInfo: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<AiOperationsService>>;

    mockCompanyRepo = {
      findByNormalizedName: vi.fn(),
      getJobsByCompany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CompanyRepository>>;

    mockCanvasRepo = {
      create: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CompanyCanvasRepository>>;

    mockMatchingSummaryService = {
      listByJob: vi.fn(),
      deleteSummary: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<MatchingSummaryService>>;

    service = new JobDescriptionService({
      repo: mockRepository,
      aiService: mockAiService,
      companyRepo: mockCompanyRepo,
      companyCanvasRepo: mockCanvasRepo,
      matchingSummaryService: mockMatchingSummaryService,
    });

    mockAiService.analyzeCompanyInfo.mockRejectedValue(new Error('AI disabled'));
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
      mockRepository.listByOwner.mockResolvedValue(mockJobs);

      const result = await service.listJobs('user-1::user-1');

      expect(mockRepository.listByOwner).toHaveBeenCalledWith('user-1::user-1');
      expect(result).toEqual(mockJobs);
    });
  });

  describe('listJobsByCompany', () => {
    it('returns empty array when companyId missing', async () => {
      const result = await service.listJobsByCompany('');
      expect(result).toEqual([]);
      expect(mockCompanyRepo.getJobsByCompany).not.toHaveBeenCalled();
    });

    it('fetches jobs filtered by companyId', async () => {
      const mockJobs = [
        { id: 'job-1', companyId: 'company-1' },
        { id: 'job-2', companyId: 'company-2' },
      ] as JobDescription[];
      mockCompanyRepo.getJobsByCompany.mockResolvedValue([mockJobs[0]]);

      const result = await service.listJobsByCompany('company-1');

      expect(mockCompanyRepo.getJobsByCompany).toHaveBeenCalledWith('company-1');
      expect(result).toEqual([mockJobs[0]]);
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
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedJob);
    });

    it('links to existing company when analysis succeeds', async () => {
      const job = {
        id: 'job-1',
        rawText: 'Job text',
        title: 'Engineer',
        owner: 'user-1::user-1',
      } as JobDescription;
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
      const jobWithCompany = { ...updatedJob, companyId: 'company-123' } as JobDescription;

      mockRepository.get.mockResolvedValue(job);
      mockAiService.parseJobDescription.mockResolvedValue(parsed);
      mockRepository.update.mockResolvedValueOnce(updatedJob).mockResolvedValueOnce(jobWithCompany);
      mockAiService.analyzeCompanyInfo.mockResolvedValue({
        companyProfile: {
          companyName: 'Acme Inc.',
          industry: 'Software',
          sizeRange: '',
          website: '',
          productsServices: ['Automation'],
          targetMarkets: [],
          customerSegments: [],
          description: '',
          rawNotes: 'Job text',
        },
        confidence: 0.9,
      });
      mockCompanyRepo.findByNormalizedName.mockResolvedValue({
        id: 'company-123',
        companyName: 'Acme Inc.',
        productsServices: [],
        targetMarkets: [],
        customerSegments: [],
      } as Company);
      mockCompanyRepo.update.mockResolvedValue({
        id: 'company-123',
        companyName: 'Acme Inc.',
      } as Company);

      const result = await service.reanalyseJob('job-1');

      expect(mockRepository.update).toHaveBeenCalledTimes(2);
      expect(mockCompanyRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'company-123',
        })
      );
      expect(result.companyId).toBe('company-123');
    });

    it('creates company and canvas when none exists', async () => {
      const job = {
        id: 'job-1',
        rawText: 'Job text',
        title: 'Engineer',
        owner: 'user-1::user-1',
      } as JobDescription;
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
      const jobWithCompany = { ...updatedJob, companyId: 'company-999' } as JobDescription;

      mockRepository.get.mockResolvedValue(job);
      mockAiService.parseJobDescription.mockResolvedValue(parsed);
      mockRepository.update.mockResolvedValueOnce(updatedJob).mockResolvedValueOnce(jobWithCompany);
      mockAiService.analyzeCompanyInfo.mockResolvedValue({
        companyProfile: {
          companyName: 'NewCo',
          industry: '',
          sizeRange: '',
          website: '',
          productsServices: [],
          targetMarkets: [],
          customerSegments: [],
          description: '',
          rawNotes: 'Job text',
        },
        confidence: 0.7,
      });
      mockCompanyRepo.findByNormalizedName.mockResolvedValue(null);
      mockCompanyRepo.create.mockResolvedValue({
        id: 'company-999',
        companyName: 'NewCo',
      } as Company);

      const result = await service.reanalyseJob('job-1');

      expect(mockCompanyRepo.create).toHaveBeenCalled();
      expect(mockCanvasRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-999',
          needsUpdate: true,
        })
      );
      expect(result.companyId).toBe('company-999');
    });

    it('continues when company analysis fails', async () => {
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
      mockAiService.analyzeCompanyInfo.mockRejectedValue(new Error('AI failed'));

      const result = await service.reanalyseJob('job-1');

      expect(result.companyId).toBeUndefined();
    });
  });

  describe('deleteJob', () => {
    it('should cascade delete matching summaries and job', async () => {
      const mockSummaries = [
        { id: 'summary-1', jobId: 'job-1' },
        { id: 'summary-2', jobId: 'job-1' },
      ];
      mockMatchingSummaryService.listByJob.mockResolvedValue(mockSummaries as never);
      mockMatchingSummaryService.deleteSummary.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteJob('job-1');

      expect(mockMatchingSummaryService.listByJob).toHaveBeenCalledWith('job-1');
      expect(mockMatchingSummaryService.deleteSummary).toHaveBeenCalledTimes(2);
      expect(mockMatchingSummaryService.deleteSummary).toHaveBeenCalledWith('summary-1');
      expect(mockMatchingSummaryService.deleteSummary).toHaveBeenCalledWith('summary-2');
      expect(mockRepository.delete).toHaveBeenCalledWith('job-1');
    });

    it('should delete job even when no matching summaries exist', async () => {
      mockMatchingSummaryService.listByJob.mockResolvedValue([]);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteJob('job-1');

      expect(mockMatchingSummaryService.listByJob).toHaveBeenCalledWith('job-1');
      expect(mockMatchingSummaryService.deleteSummary).not.toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith('job-1');
    });

    it('should throw error when jobId is not provided', async () => {
      await expect(service.deleteJob('')).rejects.toThrow('Job ID is required');
      expect(mockMatchingSummaryService.listByJob).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
