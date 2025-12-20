import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCvDocuments } from '@/composables/useCvDocuments';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import { CVDocumentService } from '@/domain/cvdocument/CVDocumentService';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import { withMockedConsoleError } from '../../../utils/withMockedConsole';

// Mock dependencies
vi.mock('@/domain/cvdocument/CVDocumentRepository');
vi.mock('@/domain/cvdocument/CVDocumentService');

describe('useCvDocuments', () => {
  let mockRepository: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  let mockService: {
    addBlock: ReturnType<typeof vi.fn>;
    updateBlock: ReturnType<typeof vi.fn>;
    removeBlock: ReturnType<typeof vi.fn>;
    reorderBlocks: ReturnType<typeof vi.fn>;
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

    mockService = {
      addBlock: vi.fn(),
      updateBlock: vi.fn(),
      removeBlock: vi.fn(),
      reorderBlocks: vi.fn(),
    };

    vi.mocked(CVDocumentRepository).mockImplementation(() => mockRepository as never);
    vi.mocked(CVDocumentService).mockImplementation(() => mockService as never);
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

    it('should handle errors during load', withMockedConsoleError(async () => {
      mockRepository.list.mockRejectedValue(new Error('Load failed'));

      const { items, error, loadAll } = useCvDocuments();

      await loadAll();

      expect(items.value).toEqual([]);
      expect(error.value).toBe('Load failed');
    }));

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

    it('should handle creation errors', withMockedConsoleError(async () => {
      mockRepository.create.mockRejectedValue(new Error('Creation failed'));

      const { error, createDocument } = useCvDocuments();

      const result = await createDocument({ name: 'CV', userId: 'user-1' } as never);

      expect(result).toBeNull();
      expect(error.value).toBe('Creation failed');
    }));

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

    it('should handle update errors', withMockedConsoleError(async () => {
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const { error, updateDocument } = useCvDocuments();

      const result = await updateDocument({ id: 'cv-1', name: 'New' } as never);

      expect(result).toBeNull();
      expect(error.value).toBe('Update failed');
    }));
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

    it('should handle deletion errors', withMockedConsoleError(async () => {
      mockRepository.delete.mockRejectedValue(new Error('Deletion failed'));

      const { error, deleteDocument } = useCvDocuments();

      const result = await deleteDocument('cv-1');

      expect(result).toBe(false);
      expect(error.value).toBe('Deletion failed');
    }));
  });

  describe('addBlock', () => {
    it('should add a block to CV document', async () => {
      const mockCV = {
        id: 'cv-1',
        name: 'My CV',
        contentJSON: { blocks: [] },
      } as CVDocument;

      const mockUpdated = {
        ...mockCV,
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: {}, order: 0 }],
        },
      };

      mockRepository.list.mockResolvedValue([mockCV]);
      mockService.addBlock.mockResolvedValue(mockUpdated);

      const { items, loadAll, addBlock } = useCvDocuments();

      await loadAll();
      const result = await addBlock('cv-1', { id: 'block-1', type: 'header', content: {} });

      expect(mockService.addBlock).toHaveBeenCalledWith('cv-1', {
        id: 'block-1',
        type: 'header',
        content: {},
      });
      expect(result).toEqual(mockUpdated);
      expect(items.value[0]).toEqual(mockUpdated);
    });

    it('should handle addBlock errors', withMockedConsoleError(async () => {
      mockService.addBlock.mockRejectedValue(new Error('Add block failed'));

      const { error, addBlock } = useCvDocuments();

      const result = await addBlock('cv-1', { id: 'block-1', type: 'header', content: {} });

      expect(result).toBeNull();
      expect(error.value).toBe('Add block failed');
    }));
  });

  describe('updateBlock', () => {
    it('should update a block in CV document', async () => {
      const mockCV = {
        id: 'cv-1',
        name: 'My CV',
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: { title: 'Old' }, order: 0 }],
        },
      } as CVDocument;

      const mockUpdated = {
        ...mockCV,
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: { title: 'New' }, order: 0 }],
        },
      };

      mockRepository.list.mockResolvedValue([mockCV]);
      mockService.updateBlock.mockResolvedValue(mockUpdated);

      const { items, loadAll, updateBlock } = useCvDocuments();

      await loadAll();
      const result = await updateBlock('cv-1', 'block-1', { content: { title: 'New' } });

      expect(mockService.updateBlock).toHaveBeenCalledWith('cv-1', 'block-1', {
        content: { title: 'New' },
      });
      expect(result).toEqual(mockUpdated);
      expect(items.value[0]).toEqual(mockUpdated);
    });

    it('should handle updateBlock errors', withMockedConsoleError(async () => {
      mockService.updateBlock.mockRejectedValue(new Error('Update block failed'));

      const { error, updateBlock } = useCvDocuments();

      const result = await updateBlock('cv-1', 'block-1', { content: {} });

      expect(result).toBeNull();
      expect(error.value).toBe('Update block failed');
    }));
  });

  describe('removeBlock', () => {
    it('should remove a block from CV document', async () => {
      const mockCV = {
        id: 'cv-1',
        name: 'My CV',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: {}, order: 0 },
            { id: 'block-2', type: 'experience', content: {}, order: 1 },
          ],
        },
      } as CVDocument;

      const mockUpdated = {
        ...mockCV,
        contentJSON: {
          blocks: [{ id: 'block-1', type: 'header', content: {}, order: 0 }],
        },
      };

      mockRepository.list.mockResolvedValue([mockCV]);
      mockService.removeBlock.mockResolvedValue(mockUpdated);

      const { items, loadAll, removeBlock } = useCvDocuments();

      await loadAll();
      const result = await removeBlock('cv-1', 'block-2');

      expect(mockService.removeBlock).toHaveBeenCalledWith('cv-1', 'block-2');
      expect(result).toEqual(mockUpdated);
      expect(items.value[0]).toEqual(mockUpdated);
    });

    it('should handle removeBlock errors', withMockedConsoleError(async () => {
      mockService.removeBlock.mockRejectedValue(new Error('Remove block failed'));

      const { error, removeBlock } = useCvDocuments();

      const result = await removeBlock('cv-1', 'block-1');

      expect(result).toBeNull();
      expect(error.value).toBe('Remove block failed');
    }));
  });

  describe('reorderBlocks', () => {
    it('should reorder blocks in CV document', async () => {
      const mockCV = {
        id: 'cv-1',
        name: 'My CV',
        contentJSON: {
          blocks: [
            { id: 'block-1', type: 'header', content: {}, order: 0 },
            { id: 'block-2', type: 'experience', content: {}, order: 1 },
          ],
        },
      } as CVDocument;

      const mockUpdated = {
        ...mockCV,
        contentJSON: {
          blocks: [
            { id: 'block-2', type: 'experience', content: {}, order: 0 },
            { id: 'block-1', type: 'header', content: {}, order: 1 },
          ],
        },
      };

      mockRepository.list.mockResolvedValue([mockCV]);
      mockService.reorderBlocks.mockResolvedValue(mockUpdated);

      const { items, loadAll, reorderBlocks } = useCvDocuments();

      await loadAll();
      const result = await reorderBlocks('cv-1', ['block-2', 'block-1']);

      expect(mockService.reorderBlocks).toHaveBeenCalledWith('cv-1', ['block-2', 'block-1']);
      expect(result).toEqual(mockUpdated);
      expect(items.value[0]).toEqual(mockUpdated);
    });

    it('should handle reorderBlocks errors', withMockedConsoleError(async () => {
      mockService.reorderBlocks.mockRejectedValue(new Error('Reorder failed'));

      const { error, reorderBlocks } = useCvDocuments();

      const result = await reorderBlocks('cv-1', ['block-1', 'block-2']);

      expect(result).toBeNull();
      expect(error.value).toBe('Reorder failed');
    }));
  });
});
