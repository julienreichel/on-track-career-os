import { ref } from 'vue';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import { CVDocumentService, type CVBlock } from '@/domain/cvdocument/CVDocumentService';
import type {
  CVDocument,
  CVDocumentCreateInput,
  CVDocumentUpdateInput,
} from '@/domain/cvdocument/CVDocument';

/**
 * Update an item in the items array
 */
function updateItemInArray(items: CVDocument[], updated: CVDocument | null) {
  if (!updated) return;
  const index = items.findIndex((item) => item.id === updated.id);
  if (index !== -1) {
    items[index] = updated;
  }
}

/**
 * Block management operations
 */
function useBlockOperations(
  items: ReturnType<typeof ref<CVDocument[]>>,
  loading: ReturnType<typeof ref<boolean>>,
  error: ReturnType<typeof ref<string | null>>,
  service: CVDocumentService
) {
  const addBlock = async (
    cvId: string,
    block: Omit<CVBlock, 'order'>
  ): Promise<CVDocument | null> => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await service.addBlock(cvId, block);
      updateItemInArray(items.value, updated);
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add block';
      console.error('[useCvDocuments] Error adding block:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateBlock = async (
    cvId: string,
    blockId: string,
    updates: Partial<Omit<CVBlock, 'id'>>
  ): Promise<CVDocument | null> => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await service.updateBlock(cvId, blockId, updates);
      updateItemInArray(items.value, updated);
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update block';
      console.error('[useCvDocuments] Error updating block:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const removeBlock = async (cvId: string, blockId: string): Promise<CVDocument | null> => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await service.removeBlock(cvId, blockId);
      updateItemInArray(items.value, updated);
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove block';
      console.error('[useCvDocuments] Error removing block:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const reorderBlocks = async (cvId: string, blockIds: string[]): Promise<CVDocument | null> => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await service.reorderBlocks(cvId, blockIds);
      updateItemInArray(items.value, updated);
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder blocks';
      console.error('[useCvDocuments] Error reordering blocks:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { addBlock, updateBlock, removeBlock, reorderBlocks };
}

/**
 * Composable for managing CV documents list and block operations
 */
export function useCvDocuments() {
  const items = ref<CVDocument[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const repository = new CVDocumentRepository();
  const service = new CVDocumentService();

  /**
   * Load all CV documents with optional filters
   */
  const loadAll = async (filter?: Record<string, unknown>) => {
    loading.value = true;
    error.value = null;

    try {
      items.value = await repository.list(filter);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCvDocuments] Error loading CV documents:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create a new CV document
   */
  const createDocument = async (input: CVDocumentCreateInput): Promise<CVDocument | null> => {
    loading.value = true;
    error.value = null;

    try {
      const created = await repository.create(input);
      if (created) {
        items.value.push(created);
      }
      return created;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create CV document';
      console.error('[useCvDocuments] Error creating CV document:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update an existing CV document
   */
  const updateDocument = async (input: CVDocumentUpdateInput): Promise<CVDocument | null> => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await repository.update(input);
      updateItemInArray(items.value, updated);
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update CV document';
      console.error('[useCvDocuments] Error updating CV document:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete a CV document
   */
  const deleteDocument = async (id: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      await repository.delete(id);
      items.value = items.value.filter((item) => item.id !== id);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete CV document';
      console.error('[useCvDocuments] Error deleting CV document:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Block operations
  const blockOps = useBlockOperations(items, loading, error, service);

  return {
    items,
    loading,
    error,
    loadAll,
    createDocument,
    updateDocument,
    deleteDocument,
    ...blockOps,
  };
}
