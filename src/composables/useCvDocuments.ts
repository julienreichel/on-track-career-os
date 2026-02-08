import { logError } from '@/utils/logError';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

export function useCvDocuments(options: { i18n?: { t: (key: string) => string } } = {}) {
  const i18n = options.i18n ?? useI18n();
  const t = i18n.t;
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
        throw new Error(t('applications.cvs.generate.errors.missingUserInfo'));
      }
      items.value = await repository.listByUser(auth.userId.value);
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('common.errors.unknown');
      logError('[useCvDocuments] Error loading CV documents:', err);
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
      error.value = err instanceof Error
        ? err.message
        : t('applications.cvs.generate.errors.cvDocumentCreateFailed');
      logError('[useCvDocuments] Error creating CV document:', err);
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
      error.value = err instanceof Error
        ? err.message
        : t('applications.cvs.generate.errors.cvDocumentUpdateFailed');
      logError('[useCvDocuments] Error updating CV document:', err);
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
      error.value = err instanceof Error
        ? err.message
        : t('applications.cvs.generate.errors.cvDocumentDeleteFailed');
      logError('[useCvDocuments] Error deleting CV document:', err);
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
