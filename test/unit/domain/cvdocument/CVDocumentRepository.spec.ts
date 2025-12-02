import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CVDocumentRepository,
  type AmplifyCVDocumentModel,
} from '@/domain/cvdocument/CVDocumentRepository';
import type { CVDocumentCreateInput, CVDocumentUpdateInput } from '@/domain/cvdocument/CVDocument';

// Mock gqlOptions
vi.mock('@/data/graphql/options', () => ({
  gqlOptions: (custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...custom,
  }),
}));

describe('CVDocumentRepository', () => {
  let repository: CVDocumentRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Inject the mock via constructor (dependency injection)
    repository = new CVDocumentRepository(mockModel as AmplifyCVDocumentModel);
  });

  describe('get', () => {
    it('should fetch a CVDocument by id', async () => {
      const mockCVDocument = {
        id: 'cv-123',
        name: 'Senior Engineer CV',
        userId: 'user-123',
        templateId: 'template-modern',
        isTailored: true,
        jobId: 'job-456',
        contentJSON: {
          header: { name: 'John Doe', title: 'Senior Engineer' },
          sections: { experience: [], education: [] },
        },
      };

      mockModel.get.mockResolvedValue({
        data: mockCVDocument,
      });

      const result = await repository.get('cv-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'cv-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCVDocument);
    });

    it('should return null when CVDocument is not found', async () => {
      mockModel.get.mockResolvedValue({
        data: null,
      });

      const result = await repository.get('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should fetch a list of CVDocument items', async () => {
      const mockCVList = [
        { id: 'cv-1', name: 'CV 1', userId: 'user-1', isTailored: false },
        { id: 'cv-2', name: 'CV 2', userId: 'user-2', isTailored: true, jobId: 'job-1' },
      ];

      mockModel.list.mockResolvedValue({
        data: mockCVList,
      });

      const result = await repository.list();

      expect(mockModel.list).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCVList);
    });

    it('should apply filters when provided', async () => {
      const mockFilter = { userId: { eq: 'user-123' } };
      mockModel.list.mockResolvedValue({
        data: [],
      });

      await repository.list(mockFilter);

      expect(mockModel.list).toHaveBeenCalledWith(
        expect.objectContaining({
          authMode: 'userPool',
          userId: { eq: 'user-123' },
        })
      );
    });

    it('should handle empty list results', async () => {
      mockModel.list.mockResolvedValue({
        data: [],
      });

      const result = await repository.list();

      expect(result).toEqual([]);
    });

    it('should filter tailored CVs', async () => {
      const mockFilter = { isTailored: { eq: true } };
      const tailoredCVs = [
        { id: 'cv-1', name: 'Tailored CV 1', isTailored: true, jobId: 'job-1' },
        { id: 'cv-2', name: 'Tailored CV 2', isTailored: true, jobId: 'job-2' },
      ];

      mockModel.list.mockResolvedValue({
        data: tailoredCVs,
      });

      const result = await repository.list(mockFilter);

      expect(result).toEqual(tailoredCVs);
      expect(result.every((cv) => cv.isTailored)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new CVDocument', async () => {
      const input: CVDocumentCreateInput = {
        name: 'New CV',
        userId: 'user-123',
        templateId: 'template-modern',
        isTailored: false,
        contentJSON: {
          header: { name: 'John Doe', title: 'Engineer' },
          sections: { experience: [], education: [] },
        },
      };

      const mockCreatedCV = {
        ...input,
        id: 'cv-456',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockModel.create.mockResolvedValue({
        data: mockCreatedCV,
      });

      const result = await repository.create(input);

      expect(mockModel.create).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockCreatedCV);
    });

    it('should handle creating tailored CV with jobId', async () => {
      const input: CVDocumentCreateInput = {
        name: 'Tailored CV for Tech Corp',
        userId: 'user-123',
        jobId: 'job-456',
        templateId: 'template-professional',
        isTailored: true,
        contentJSON: {
          tailored: true,
          jobSpecific: ['AWS expertise', 'Leadership'],
        },
      };

      const mockCreatedCV = {
        ...input,
        id: 'cv-789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockModel.create.mockResolvedValue({
        data: mockCreatedCV,
      });

      const result = await repository.create(input);

      expect(result?.jobId).toBe('job-456');
      expect(result?.isTailored).toBe(true);
    });

    it('should handle creating CV with minimal fields', async () => {
      const input: CVDocumentCreateInput = {
        name: 'Basic CV',
        userId: 'user-123',
      };

      const mockCreatedCV = {
        ...input,
        id: 'cv-minimal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockModel.create.mockResolvedValue({
        data: mockCreatedCV,
      });

      const result = await repository.create(input);

      expect(result).toEqual(mockCreatedCV);
    });

    it('should handle creating CV with null contentJSON', async () => {
      const input: CVDocumentCreateInput = {
        name: 'Empty CV',
        userId: 'user-123',
        templateId: 'template-blank',
        contentJSON: null,
      };

      mockModel.create.mockResolvedValue({
        data: { ...input, id: 'cv-empty' },
      });

      const result = await repository.create(input);

      expect(result?.contentJSON).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing CVDocument', async () => {
      const input: CVDocumentUpdateInput = {
        id: 'cv-123',
        name: 'Updated CV Name',
        isTailored: true,
        jobId: 'job-789',
      };

      const mockUpdatedCV = {
        ...input,
        userId: 'user-123',
        updatedAt: new Date().toISOString(),
      };

      mockModel.update.mockResolvedValue({
        data: mockUpdatedCV,
      });

      const result = await repository.update(input);

      expect(mockModel.update).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(mockUpdatedCV);
    });

    it('should handle partial updates', async () => {
      const input: CVDocumentUpdateInput = {
        id: 'cv-123',
        name: 'New Name Only',
      };

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(mockModel.update).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(result).toEqual(input);
    });

    it('should handle updating contentJSON', async () => {
      const input: CVDocumentUpdateInput = {
        id: 'cv-123',
        contentJSON: {
          header: { name: 'Jane Doe', title: 'Senior Engineer' },
          sections: {
            experience: [{ company: 'Tech Corp', title: 'Lead Engineer', years: 5 }],
          },
        },
      };

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.contentJSON).toBeDefined();
      expect(result?.contentJSON).toEqual(input.contentJSON);
    });

    it('should handle updating template', async () => {
      const input: CVDocumentUpdateInput = {
        id: 'cv-123',
        templateId: 'template-updated',
      };

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.templateId).toBe('template-updated');
    });

    it('should handle converting CV to tailored', async () => {
      const input: CVDocumentUpdateInput = {
        id: 'cv-123',
        isTailored: true,
        jobId: 'job-new',
      };

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.isTailored).toBe(true);
      expect(result?.jobId).toBe('job-new');
    });
  });

  describe('delete', () => {
    it('should delete a CVDocument by id', async () => {
      mockModel.delete.mockResolvedValue({
        data: { id: 'cv-123' },
      });

      await repository.delete('cv-123');

      expect(mockModel.delete).toHaveBeenCalledWith(
        { id: 'cv-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
    });

    it('should handle deletion errors', async () => {
      mockModel.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(repository.delete('cv-123')).rejects.toThrow('Deletion failed');
    });

    it('should not throw when deleting non-existent CVDocument', async () => {
      mockModel.delete.mockResolvedValue({
        data: null,
      });

      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('constructor', () => {
    it('should accept a custom model via dependency injection', () => {
      const customModel = {
        get: vi.fn(),
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };

      const repoWithCustomModel = new CVDocumentRepository(customModel as AmplifyCVDocumentModel);

      expect(repoWithCustomModel).toBeInstanceOf(CVDocumentRepository);
    });
  });
});
