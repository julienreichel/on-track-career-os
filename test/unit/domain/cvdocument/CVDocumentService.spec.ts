import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

// Mock the repository
vi.mock('@/domain/cvdocument/CVDocumentRepository');

describe('CVDocumentService', () => {
  let service: CVDocumentService;
  let mockRepository: ReturnType<typeof vi.mocked<CVDocumentRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      listByUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<CVDocumentRepository>>;

    service = new CVDocumentService(mockRepository);
  });

  describe('getFullCVDocument', () => {
    it('should fetch a complete CVDocument by id', async () => {
      const mockCVDocument = {
        id: 'cvdocument-123',
        name: 'Senior Engineer CV',
        userId: 'user-123',
        templateId: 'template-modern',
        isTailored: true,
        jobId: 'job-456',
        contentJSON: {
          header: { name: 'John Doe', title: 'Senior Engineer' },
          sections: {
            experience: [{ company: 'Tech Corp', title: 'Senior Engineer' }],
            education: [{ degree: 'BS Computer Science', school: 'Tech University' }],
          },
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(mockCVDocument);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(mockRepository.get).toHaveBeenCalledWith('cvdocument-123');
      expect(result).toEqual(mockCVDocument);
    });

    it('should return null when CVDocument does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullCVDocument('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle errors from repository', async () => {
      mockRepository.get.mockRejectedValue(new Error('Database error'));

      await expect(service.getFullCVDocument('cvdocument-123')).rejects.toThrow('Database error');
    });

    it('should handle CVDocument with minimal data', async () => {
      const minimalCV = {
        id: 'cvdocument-123',
        name: 'Basic CV',
        userId: 'user-123',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(minimalCV);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(result).toEqual(minimalCV);
    });

    it('should handle tailored CV with jobId', async () => {
      const tailoredCV = {
        id: 'cvdocument-123',
        name: 'Tailored CV for Tech Corp',
        userId: 'user-123',
        jobId: 'job-456',
        isTailored: true,
        templateId: 'template-professional',
        contentJSON: {
          tailored: true,
          highlights: ['AWS expertise', 'Leadership experience'],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(tailoredCV);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(result?.isTailored).toBe(true);
      expect(result?.jobId).toBe('job-456');
      expect(result).toEqual(tailoredCV);
    });

    it('should handle generic CV without jobId', async () => {
      const genericCV = {
        id: 'cvdocument-123',
        name: 'Generic CV',
        userId: 'user-123',
        isTailored: false,
        templateId: 'template-classic',
        contentJSON: {
          sections: ['experience', 'education', 'skills'],
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(genericCV);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(result?.isTailored).toBe(false);
      expect(result?.jobId).toBeUndefined();
      expect(result).toEqual(genericCV);
    });

    it('should handle CV with complex contentJSON', async () => {
      const complexCV = {
        id: 'cvdocument-123',
        name: 'Comprehensive CV',
        userId: 'user-123',
        templateId: 'template-modern',
        isTailored: true,
        jobId: 'job-789',
        contentJSON: {
          header: {
            name: 'Jane Smith',
            title: 'Technical Lead',
            contact: {
              email: 'jane@example.com',
              phone: '+1234567890',
            },
          },
          sections: {
            summary: 'Experienced technical leader...',
            experience: [
              {
                company: 'Tech Corp',
                title: 'Senior Engineer',
                dates: '2020-2024',
                achievements: ['Led team of 5', 'Increased efficiency by 40%'],
              },
            ],
            education: [{ degree: 'MS Computer Science', school: 'Tech University' }],
            skills: ['TypeScript', 'AWS', 'Leadership'],
          },
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(complexCV);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(result?.contentJSON).toBeDefined();
      expect(result).toEqual(complexCV);
    });

    it('should handle CV with null contentJSON', async () => {
      const cvWithNullContent = {
        id: 'cvdocument-123',
        name: 'Empty CV',
        userId: 'user-123',
        templateId: 'template-blank',
        isTailored: false,
        contentJSON: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        owner: 'user-123::user-123',
      } as CVDocument;

      mockRepository.get.mockResolvedValue(cvWithNullContent);

      const result = await service.getFullCVDocument('cvdocument-123');

      expect(result?.contentJSON).toBeNull();
      expect(result).toEqual(cvWithNullContent);
    });
  });

  describe('constructor', () => {
    it('should use default repository when not provided', () => {
      const serviceWithDefaultRepo = new CVDocumentService();
      expect(serviceWithDefaultRepo).toBeInstanceOf(CVDocumentService);
    });

    it('should accept a custom repository', () => {
      const customRepo = new CVDocumentRepository();
      const serviceWithCustomRepo = new CVDocumentService(customRepo);
      expect(serviceWithCustomRepo).toBeInstanceOf(CVDocumentService);
    });
  });
});
