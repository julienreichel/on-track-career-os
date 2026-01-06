import { ref } from 'vue';
import { CoverLetterRepository } from '@/domain/cover-letter/CoverLetterRepository';
import type {
  CoverLetter,
  CoverLetterCreateInput,
  CoverLetterUpdateInput,
} from '@/domain/cover-letter/CoverLetter';

function updateItemInArray(items: CoverLetter[], updated: CoverLetter | null | undefined): void {
  if (!updated) return;
  const index = items.findIndex((item) => item.id === updated.id);
  if (index !== -1) {
    items[index] = updated;
  }
}

export function useCoverLetters() {
  const items = ref<CoverLetter[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const repository = new CoverLetterRepository();

  const loadAll = async (filter?: Record<string, unknown>) => {
    loading.value = true;
    error.value = null;

    try {
      items.value = await repository.list(filter ?? {});
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCoverLetters] Error loading cover letters:', err);
    } finally {
      loading.value = false;
    }
  };

  const createCoverLetter = async (
    input: CoverLetterCreateInput
  ): Promise<CoverLetter | null> => {
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
      error.value = err instanceof Error ? err.message : 'Failed to create cover letter';
      console.error('[useCoverLetters] Error creating cover letter:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateCoverLetter = async (
    input: CoverLetterUpdateInput
  ): Promise<CoverLetter | null> => {
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
      error.value = err instanceof Error ? err.message : 'Failed to update cover letter';
      console.error('[useCoverLetters] Error updating cover letter:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteCoverLetter = async (id: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      await repository.delete(id);
      items.value = items.value.filter((item) => item.id !== id);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete cover letter';
      console.error('[useCoverLetters] Error deleting cover letter:', err);
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
    createCoverLetter,
    updateCoverLetter,
    deleteCoverLetter,
  };
}
