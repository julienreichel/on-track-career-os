import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CVDocumentRepository,
  type AmplifyCVDocumentModel,
} from '@/domain/cvdocument/CVDocumentRepository';
import type { CVDocumentCreateInput, CVDocumentUpdateInput } from '@/domain/cvdocument/CVDocument';
import type { AmplifyUserProfileModel } from '@/domain/user-profile/UserProfileRepository';

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
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockUserProfileModel: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockModel = {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockUserProfileModel = {
      get: vi.fn(),
    };

    // Inject the mock via constructor (dependency injection)
    repository = new CVDocumentRepository(
      mockModel as AmplifyCVDocumentModel,
      mockUserProfileModel as AmplifyUserProfileModel
    );
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
        content: '# John Doe\n\n## Senior Engineer\n\n**Experience**\n\n**Education**',
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

  describe('listByUser', () => {
    it('should fetch CVDocument items for a user profile', async () => {
      const mockCVList = [
        { id: 'cv-1', name: 'CV 1', userId: 'user-1', isTailored: false },
        { id: 'cv-2', name: 'CV 2', userId: 'user-2', isTailored: true, jobId: 'job-1' },
      ];

      mockUserProfileModel.get.mockResolvedValue({
        data: { id: 'user-1', cvs: mockCVList },
      });

      const result = await repository.listByUser('user-1');

      expect(mockUserProfileModel.get).toHaveBeenCalledWith(
        { id: 'user-1' },
        expect.objectContaining({ authMode: 'userPool', selectionSet: ['id', 'cvs.*'] })
      );
      expect(result).toEqual(mockCVList);
    });

    it('should handle empty results', async () => {
      mockUserProfileModel.get.mockResolvedValue({
        data: { id: 'user-1', cvs: [] },
      });

      const result = await repository.listByUser('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when userId missing', async () => {
      const result = await repository.listByUser('');

      expect(result).toEqual([]);
      expect(mockUserProfileModel.get).not.toHaveBeenCalled();
    });

    it('should filter tailored CVs client side', async () => {
      const tailoredCVs = [
        { id: 'cv-1', name: 'Tailored CV 1', isTailored: true, jobId: 'job-1' },
        { id: 'cv-2', name: 'Tailored CV 2', isTailored: true, jobId: 'job-2' },
      ];

      mockUserProfileModel.get.mockResolvedValue({
        data: { id: 'user-1', cvs: tailoredCVs },
      });

      const result = await repository.listByUser('user-1');

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
        content: '# John Doe\n\n## Experience\n...',
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
        content: '# Tailored CV\n\n- AWS expertise\n- Leadership',
      } as unknown as CVDocumentCreateInput;

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
      } as unknown as CVDocumentCreateInput;

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

    it('should handle creating CV with null content', async () => {
      const input: CVDocumentCreateInput = {
        name: 'Empty CV',
        userId: 'user-123',
        templateId: 'template-blank',
        content: null,
      } as unknown as CVDocumentCreateInput;

      mockModel.create.mockResolvedValue({
        data: { ...input, id: 'cv-empty' },
      });

      const result = await repository.create(input);

      expect(result?.content).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing CVDocument', async () => {
      const input = {
        id: 'cv-123',
        name: 'Updated CV Name',
        isTailored: true,
        jobId: 'job-789',
      } as unknown as CVDocumentUpdateInput;

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
      const input = {
        id: 'cv-123',
        name: 'New Name Only',
      } as unknown as CVDocumentUpdateInput;

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

    it('should handle updating content', async () => {
      const input = {
        id: 'cv-123',
        content: '# Jane Doe\n\n## Senior Engineer\n\n**Tech Corp** - Lead Engineer (5 years)',
      } as unknown as CVDocumentUpdateInput;

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.content).toBeDefined();
      expect(result?.content).toEqual(input.content);
    });

    it('should handle updating template', async () => {
      const input = {
        id: 'cv-123',
        templateId: 'template-updated',
      } as unknown as CVDocumentUpdateInput;

      mockModel.update.mockResolvedValue({
        data: input,
      });

      const result = await repository.update(input);

      expect(result?.templateId).toBe('template-updated');
    });

    it('should handle converting CV to tailored', async () => {
      const input = {
        id: 'cv-123',
        isTailored: true,
        jobId: 'job-new',
      } as unknown as CVDocumentUpdateInput;

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
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      const customUserProfileModel = {
        get: vi.fn(),
      };

      const repoWithCustomModel = new CVDocumentRepository(
        customModel as AmplifyCVDocumentModel,
        customUserProfileModel as AmplifyUserProfileModel
      );

      expect(repoWithCustomModel).toBeInstanceOf(CVDocumentRepository);
    });
  });
});
