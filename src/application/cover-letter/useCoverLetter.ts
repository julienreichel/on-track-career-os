import { ref } from 'vue';
import { CoverLetterService } from '@/domain/cover-letter/CoverLetterService';
import type { CoverLetter, CoverLetterUpdateInput } from '@/domain/cover-letter/CoverLetter';

export function useCoverLetter(id: string) {
  const item = ref<CoverLetter | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new CoverLetterService();

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      item.value = await service.getFullCoverLetter(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCoverLetter] Error loading coverletter:', err);
    } finally {
      loading.value = false;
    }
  };

  const save = async (input: CoverLetterUpdateInput) => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await service.updateCoverLetter(input);
      item.value = updated ?? item.value;
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCoverLetter] Error updating coverletter:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const remove = async () => {
    if (!item.value?.id) {
      return false;
    }
    loading.value = true;
    error.value = null;

    try {
      await service.deleteCoverLetter(item.value.id);
      item.value = null;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useCoverLetter] Error deleting coverletter:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, error, load, save, remove };
}
