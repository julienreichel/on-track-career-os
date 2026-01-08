import { ref } from 'vue';
import { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import { useAuthUser } from '@/composables/useAuthUser';
import type {
  CVDocument,
  CVDocumentCreateInput,
  CVDocumentUpdateInput,
} from '@/domain/cvdocument/CVDocument';

/**
 * Update an item in the items array
 */
function updateItemInArray(items: CVDocument[], updated: CVDocument | null | undefined): void {
  if (!updated) return;
  const index = items.findIndex((item) => item.id === updated.id);
  if (index !== -1) {
    items[index] = updated;
  }
}

/**
 * Composable for managing CV documents list and block operations
 */

export function useCvDocuments() {
  const items = ref<CVDocument[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const repository = new CVDocumentRepository();
  const auth = useAuthUser();

  /**
   * Load all CV documents for the current user
   */
  const loadAll = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (!auth.userId.value) {
        await auth.loadUserId();
      }
      if (!auth.userId.value) {
        throw new Error('Missing user information');
      }
      items.value = await repository.listByUser(auth.userId.value);
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
      const created = await repository.create({
        ...input,
        ...(input.jobId === null && { jobId: undefined }),
      });
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
      const updated = await repository.update({
        ...input,
        ...(input.jobId === null && { jobId: undefined }),
      });
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

  return {
    items,
    loading,
    error,
    loadAll,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
