import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCvDocuments } from '@/composables/useCvDocuments';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import { withMockedConsoleError } from '../../../utils/withMockedConsole';

// Mock dependencies
vi.mock('@/domain/cvdocument/CVDocumentRepository');

describe('useCvDocuments', () => {
  let mockRepository: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };

    vi.mocked(CVDocumentRepository).mockImplementation(() => mockRepository as never);
  });

  describe('loadAll', () => {
    it('should load all CV documents', async () => {
      const mockCVs = [
        { id: 'cv-1', name: 'CV 1', userId: 'user-1' },
        { id: 'cv-2', name: 'CV 2', userId: 'user-1' },
      ] as CVDocument[];

      mockRepository.list.mockResolvedValue(mockCVs);

      const { items, loading, error, loadAll } = useCvDocuments();

      expect(loading.value).toBe(false);

      await loadAll();

      expect(mockRepository.list).toHaveBeenCalledWith(undefined);
      expect(items.value).toEqual(mockCVs);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should load CV documents with filter', async () => {
      const mockFilter = { isTailored: { eq: true } };
      const mockCVs = [{ id: 'cv-1', name: 'Tailored CV', isTailored: true }] as CVDocument[];

      mockRepository.list.mockResolvedValue(mockCVs);

      const { items, loadAll } = useCvDocuments();

      await loadAll(mockFilter);

      expect(mockRepository.list).toHaveBeenCalledWith(mockFilter);
      expect(items.value).toEqual(mockCVs);
    });

    it(
      'should handle errors during load',
      withMockedConsoleError(async () => {
        mockRepository.list.mockRejectedValue(new Error('Load failed'));

        const { items, error, loadAll } = useCvDocuments();

        await loadAll();

        expect(items.value).toEqual([]);
        expect(error.value).toBe('Load failed');
      })
    );

    it('should set loading state correctly', async () => {
      mockRepository.list.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 10))
      );

      const { loading, loadAll } = useCvDocuments();

      const loadPromise = loadAll();
      expect(loading.value).toBe(true);

      await loadPromise;
      expect(loading.value).toBe(false);
    });
  });

  describe('createDocument', () => {
    it('should create a new CV document', async () => {
      const input = {
        name: 'New CV',
        userId: 'user-1',
        isTailored: false,
      };

      const mockCreated = {
        ...input,
        id: 'cv-123',
        createdAt: '2025-01-01',
      } as CVDocument;

      mockRepository.create.mockResolvedValue(mockCreated);

      const { items, createDocument } = useCvDocuments();

      const result = await createDocument(input as never);

      expect(mockRepository.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockCreated);
      expect(items.value).toHaveLength(1);
      expect(items.value[0]).toEqual(mockCreated);
    });

    it(
      'should handle creation errors',
      withMockedConsoleError(async () => {
        mockRepository.create.mockRejectedValue(new Error('Creation failed'));

        const { error, createDocument } = useCvDocuments();

        const result = await createDocument({ name: 'CV', userId: 'user-1' } as never);

        expect(result).toBeNull();
        expect(error.value).toBe('Creation failed');
      })
    );

    it('should not add to items if creation returns null', async () => {
      mockRepository.create.mockResolvedValue(null);

      const { items, createDocument } = useCvDocuments();

      await createDocument({ name: 'CV', userId: 'user-1' } as never);

      expect(items.value).toHaveLength(0);
    });
  });

  describe('updateDocument', () => {
    it('should update an existing CV document', async () => {
      const mockCV = { id: 'cv-1', name: 'Old Name', userId: 'user-1' } as CVDocument;
      const mockUpdated = { ...mockCV, name: 'New Name' };

      mockRepository.list.mockResolvedValue([mockCV]);
      mockRepository.update.mockResolvedValue(mockUpdated);

      const { items, loadAll, updateDocument } = useCvDocuments();

      await loadAll();
      const result = await updateDocument({ id: 'cv-1', name: 'New Name' } as never);

      expect(result).toEqual(mockUpdated);
      expect(items.value[0]).toEqual(mockUpdated);
    });

    it(
      'should handle update errors',
      withMockedConsoleError(async () => {
        mockRepository.update.mockRejectedValue(new Error('Update failed'));

        const { error, updateDocument } = useCvDocuments();

        const result = await updateDocument({ id: 'cv-1', name: 'New' } as never);

        expect(result).toBeNull();
        expect(error.value).toBe('Update failed');
      })
    );
  });

  describe('deleteDocument', () => {
    it('should delete a CV document', async () => {
      const mockCVs = [
        { id: 'cv-1', name: 'CV 1' },
        { id: 'cv-2', name: 'CV 2' },
      ] as CVDocument[];

      mockRepository.list.mockResolvedValue(mockCVs);
      mockRepository.delete.mockResolvedValue(undefined);

      const { items, loadAll, deleteDocument } = useCvDocuments();

      await loadAll();
      const result = await deleteDocument('cv-1');

      expect(result).toBe(true);
      expect(items.value).toHaveLength(1);
      expect(items.value[0].id).toBe('cv-2');
    });

    it(
      'should handle deletion errors',
      withMockedConsoleError(async () => {
        mockRepository.delete.mockRejectedValue(new Error('Deletion failed'));

        const { error, deleteDocument } = useCvDocuments();

        const result = await deleteDocument('cv-1');

        expect(result).toBe(false);
        expect(error.value).toBe('Deletion failed');
      })
    );
  });
});
