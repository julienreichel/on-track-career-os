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
      list: vi.fn(),
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

  describe('addBlock', () => {
    it('should add a new block to CV document', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: { title: 'John Doe' }, order: 0 },
          ],
        },
      } as CVDocument;

      const mockUpdatedCV = {
        ...mockCV,
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: { title: 'John Doe' }, order: 0 },
            { id: 'block-2', type: 'experience', content: { company: 'Tech Corp' }, order: 1 },
          ],
        },
      };

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockUpdatedCV);

      const result = await service.addBlock('cv-123', {
        id: 'block-2',
        type: 'experience',
        content: { company: 'Tech Corp' },
      });

      expect(mockRepository.get).toHaveBeenCalledWith('cv-123');
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result?.contentJSON).toEqual(mockUpdatedCV.contentJSON);
    });

    it('should add block to empty CV', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {},
      } as CVDocument;

      const mockUpdatedCV = {
        ...mockCV,
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: { title: 'John Doe' }, order: 0 }],
        },
      };

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockUpdatedCV);

      const result = await service.addBlock('cv-123', {
        id: 'block-1',
        type: 'header',
        content: { title: 'John Doe' },
      });

      expect(result?.contentJSON).toEqual(mockUpdatedCV.contentJSON);
    });

    it('should return null if CV not found', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.addBlock('non-existent', {
        id: 'block-1',
        type: 'header',
        content: {},
      });

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateBlock', () => {
    it('should update an existing block', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: { title: 'John Doe' }, order: 0 },
            { id: 'block-2', type: 'experience', content: { company: 'Old Corp' }, order: 1 },
          ],
        },
      } as CVDocument;

      const mockUpdatedCV = {
        ...mockCV,
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: { title: 'John Doe' }, order: 0 },
            { id: 'block-2', type: 'experience', content: { company: 'Tech Corp' }, order: 1 },
          ],
        },
      };

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockUpdatedCV);

      const result = await service.updateBlock('cv-123', 'block-2', {
        content: { company: 'Tech Corp' },
      });

      expect(result?.contentJSON).toEqual(mockUpdatedCV.contentJSON);
    });

    it('should return null if block not found', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: {}, order: 0 }],
        },
      } as CVDocument;

      mockRepository.get.mockResolvedValue(mockCV);

      const result = await service.updateBlock('cv-123', 'non-existent-block', {
        content: { updated: true },
      });

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should return null if CV not found', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.updateBlock('non-existent', 'block-1', { content: {} });

      expect(result).toBeNull();
    });
  });

  describe('removeBlock', () => {
    it('should remove a block and reorder remaining blocks', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: {}, order: 0 },
            { id: 'block-2', type: 'experience', content: {}, order: 1 },
            { id: 'block-3', type: 'skills', content: {}, order: 2 },
          ],
        },
      } as CVDocument;

      const mockUpdatedCV = {
        ...mockCV,
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: {}, order: 0 },
            { id: 'block-3', type: 'skills', content: {}, order: 1 },
          ],
        },
      };

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockUpdatedCV);

      const result = await service.removeBlock('cv-123', 'block-2');

      expect(result?.contentJSON).toEqual(mockUpdatedCV.contentJSON);
    });

    it('should handle removing non-existent block', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: {}, order: 0 }],
        },
      } as CVDocument;

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockCV);

      const result = await service.removeBlock('cv-123', 'non-existent');

      expect(result).not.toBeNull();
    });

    it('should return null if CV not found', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.removeBlock('non-existent', 'block-1');

      expect(result).toBeNull();
    });
  });

  describe('reorderBlocks', () => {
    it('should reorder blocks according to provided array', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: {}, order: 0 },
            { id: 'block-2', type: 'experience', content: {}, order: 1 },
            { id: 'block-3', type: 'skills', content: {}, order: 2 },
          ],
        },
      } as CVDocument;

      const mockUpdatedCV = {
        ...mockCV,
        contentJSON: {
          blocks: [
            { id: 'block-3', type: 'skills', content: {}, order: 0 },
            { id: 'block-1', type: 'header', content: {}, order: 1 },
            { id: 'block-2', type: 'experience', content: {}, order: 2 },
          ],
        },
      };

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockUpdatedCV);

      const result = await service.reorderBlocks('cv-123', ['block-3', 'block-1', 'block-2']);

      expect(result?.contentJSON).toEqual(mockUpdatedCV.contentJSON);
    });

    it('should handle partial reordering (missing blocks)', async () => {
      const mockCV = {
        id: 'cv-123',
        name: 'My CV',
        userId: 'user-123',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: {}, order: 0 },
            { id: 'block-2', type: 'experience', content: {}, order: 1 },
            { id: 'block-3', type: 'skills', content: {}, order: 2 },
          ],
        },
      } as CVDocument;

      mockRepository.get.mockResolvedValue(mockCV);
      mockRepository.update.mockResolvedValue(mockCV);

      const result = await service.reorderBlocks('cv-123', ['block-2', 'block-1']);

      expect(result).not.toBeNull();
    });

    it('should return null if CV not found', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.reorderBlocks('non-existent', ['block-1', 'block-2']);

      expect(result).toBeNull();
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
