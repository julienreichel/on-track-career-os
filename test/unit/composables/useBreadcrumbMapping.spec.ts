import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBreadcrumbMapping } from '@/composables/useBreadcrumbMapping';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';
import { CompanyService } from '@/domain/company/CompanyService';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { allowConsoleOutput, getConsoleCalls } from '../../setup/console-guard';
import type { Experience } from '@/domain/experience/Experience';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { Company } from '@/domain/company/Company';
import type { JobDescription } from '@/domain/job-description/JobDescription';

// Mock services
vi.mock('@/domain/experience/ExperienceService', () => ({
  ExperienceService: vi.fn(),
}));
vi.mock('@/domain/cvdocument/CVDocumentService', () => ({
  CVDocumentService: vi.fn(),
}));
vi.mock('@/domain/cvtemplate/CVTemplateService', () => ({
  CVTemplateService: vi.fn(),
}));
vi.mock('@/domain/company/CompanyService', () => ({
  CompanyService: vi.fn(),
}));
vi.mock('@/domain/job-description/JobDescriptionService', () => ({
  JobDescriptionService: vi.fn(),
}));

describe('useBreadcrumbMapping', () => {
  let mockExperienceService: {
    getFullExperience: ReturnType<typeof vi.fn>;
  };
  let mockCvDocumentService: {
    getFullCVDocument: ReturnType<typeof vi.fn>;
  };
  let mockCvTemplateService: {
    get: ReturnType<typeof vi.fn>;
  };
  let mockCompanyService: {
    getCompany: ReturnType<typeof vi.fn>;
  };
  let mockJobService: {
    getFullJobDescription: ReturnType<typeof vi.fn>;
  };
  const toast = { add: vi.fn() };
  const options = {
    fallbackLabel: 'Unknown',
    toast,
    errorTitle: 'Error',
    errorDescription: 'Unable to resolve breadcrumb name.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache BEFORE each test
    const { clearCache } = useBreadcrumbMapping(options);
    clearCache();
    toast.add.mockClear();

    mockExperienceService = {
      getFullExperience: vi.fn(),
    };
    vi.mocked(ExperienceService).mockImplementation(() => mockExperienceService as never);

    mockCvDocumentService = {
      getFullCVDocument: vi.fn(),
    };
    vi.mocked(CVDocumentService).mockImplementation(() => mockCvDocumentService as never);

    mockCvTemplateService = {
      get: vi.fn(),
    };
    vi.mocked(CVTemplateService).mockImplementation(() => mockCvTemplateService as never);

    mockCompanyService = {
      getCompany: vi.fn(),
    };
    vi.mocked(CompanyService).mockImplementation(() => mockCompanyService as never);

    mockJobService = {
      getFullJobDescription: vi.fn(),
    };
    vi.mocked(JobDescriptionService).mockImplementation(() => mockJobService as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isUUID', () => {
    it('should recognize valid UUIDs', () => {
      const { isUUID } = useBreadcrumbMapping(options);

      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const { isUUID } = useBreadcrumbMapping(options);

      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('experiences')).toBe(false);
      expect(isUUID('123-456-789')).toBe(false);
      expect(isUUID('')).toBe(false);
      expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false); // too short
    });

    it('should handle both uppercase and lowercase UUIDs', () => {
      const { isUUID } = useBreadcrumbMapping(options);

      expect(isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('resolveSegment', () => {
    it('should return null for non-UUID segments', async () => {
      const { resolveSegment } = useBreadcrumbMapping(options);

      const result = await resolveSegment('experiences');

      expect(result).toBeNull();
      expect(mockExperienceService.getFullExperience).not.toHaveBeenCalled();
    });

    it('should resolve experience ID to company name', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440000';
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        companyName: 'Acme Corp',
        title: 'Software Engineer',
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment(experienceId, 'experiences');

      expect(result).toBe('Acme Corp');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledWith(experienceId);
    });

    it('should fallback to title if company name is missing', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440001'; // Different ID
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        title: 'Freelance Developer',
        companyName: undefined,
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment(experienceId, 'experiences');

      expect(result).toBe('Freelance Developer');
    });

    it('should return null for UUID without previous segment', async () => {
      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeNull();
      expect(mockExperienceService.getFullExperience).not.toHaveBeenCalled();
    });

    it('should return null for UUID with unrecognized previous segment', async () => {
      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment('550e8400-e29b-41d4-a716-446655440000', 'unknown');

      expect(result).toBeNull();
      expect(mockExperienceService.getFullExperience).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully and return fallback label', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440002'; // Different ID
      mockExperienceService.getFullExperience.mockRejectedValue(new Error('API error'));
      const { resolveSegment } = useBreadcrumbMapping(options);
      let result: string | null = null;
      await allowConsoleOutput(async () => {
        result = await resolveSegment(experienceId, 'experiences');
      });

      expect(result).toBe('Unknown');
      expect(toast.add).toHaveBeenCalled();
      const calls = getConsoleCalls();
      expect(calls.some((call) => call.method === 'error')).toBe(true);
    });

    it('should cache resolved names', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440003'; // Different ID
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        companyName: 'Cache Test Corp',
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment } = useBreadcrumbMapping(options);

      // First call - should hit API
      const result1 = await resolveSegment(experienceId, 'experiences');
      expect(result1).toBe('Cache Test Corp');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await resolveSegment(experienceId, 'experiences');
      expect(result2).toBe('Cache Test Corp');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(1); // not called again
    });
  });

  describe('clearCache', () => {
    it('should clear cached mappings', async () => {
      const experienceId = '550e8400-e29b-41d4-a716-446655440004'; // Different ID
      const mockExperience: Partial<Experience> = {
        id: experienceId,
        companyName: 'Clear Cache Corp',
      };

      mockExperienceService.getFullExperience.mockResolvedValue(mockExperience);

      const { resolveSegment, clearCache } = useBreadcrumbMapping(options);

      // First call - cache the result
      await resolveSegment(experienceId, 'experiences');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(1);

      // Clear cache
      clearCache();

      // Second call - should hit API again
      await resolveSegment(experienceId, 'experiences');
      expect(mockExperienceService.getFullExperience).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolveSegment for other entities', () => {
    it('resolves CV document IDs', async () => {
      const cvId = '550e8400-e29b-41d4-a716-446655440010';
      const mockCv: Partial<CVDocument> = { id: cvId, name: 'My CV' };
      mockCvDocumentService.getFullCVDocument.mockResolvedValue(mockCv);

      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment(cvId, 'cv');

      expect(result).toBe('My CV');
      expect(mockCvDocumentService.getFullCVDocument).toHaveBeenCalledWith(cvId);
    });

    it('resolves CV template IDs when under settings', async () => {
      const templateId = '550e8400-e29b-41d4-a716-446655440011';
      const mockTemplate: Partial<CVTemplate> = { id: templateId, name: 'Template A' };
      mockCvTemplateService.get.mockResolvedValue(mockTemplate);

      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment(templateId, 'cv', 'settings');

      expect(result).toBe('Template A');
      expect(mockCvTemplateService.get).toHaveBeenCalledWith(templateId);
    });

    it('resolves company IDs', async () => {
      const companyId = '550e8400-e29b-41d4-a716-446655440012';
      const mockCompany: Partial<Company> = { id: companyId, companyName: 'Acme' };
      mockCompanyService.getCompany.mockResolvedValue(mockCompany);

      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment(companyId, 'companies');

      expect(result).toBe('Acme');
      expect(mockCompanyService.getCompany).toHaveBeenCalledWith(companyId);
    });

    it('resolves job IDs', async () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440013';
      const mockJob: Partial<JobDescription> = { id: jobId, title: 'Lead Engineer' };
      mockJobService.getFullJobDescription.mockResolvedValue(mockJob);

      const { resolveSegment } = useBreadcrumbMapping(options);
      const result = await resolveSegment(jobId, 'jobs');

      expect(result).toBe('Lead Engineer');
      expect(mockJobService.getFullJobDescription).toHaveBeenCalledWith(jobId);
    });
  });
});
