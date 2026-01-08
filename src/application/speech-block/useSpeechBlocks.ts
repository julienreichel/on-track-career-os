import { ref } from 'vue';
import { SpeechBlockRepository } from '@/domain/speech-block/SpeechBlockRepository';
import { useAuthUser } from '@/composables/useAuthUser';
import type {
  SpeechBlock,
  SpeechBlockCreateInput,
  SpeechBlockUpdateInput,
} from '@/domain/speech-block/SpeechBlock';

function updateItemInArray(items: SpeechBlock[], updated: SpeechBlock | null | undefined): void {
  if (!updated) return;
  const index = items.findIndex((item) => item.id === updated.id);
  if (index !== -1) {
    items[index] = updated;
  }
}

export function useSpeechBlocks() {
  const items = ref<SpeechBlock[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const repository = new SpeechBlockRepository();
  const auth = useAuthUser();

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
      console.error('[useSpeechBlocks] Error loading speech blocks:', err);
    } finally {
      loading.value = false;
    }
  };

  const createSpeechBlock = async (input: SpeechBlockCreateInput): Promise<SpeechBlock | null> => {
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
      error.value = err instanceof Error ? err.message : 'Failed to create speech block';
      console.error('[useSpeechBlocks] Error creating speech block:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateSpeechBlock = async (input: SpeechBlockUpdateInput): Promise<SpeechBlock | null> => {
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
      error.value = err instanceof Error ? err.message : 'Failed to update speech block';
      console.error('[useSpeechBlocks] Error updating speech block:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteSpeechBlock = async (id: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      await repository.delete(id);
      items.value = items.value.filter((item) => item.id !== id);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete speech block';
      console.error('[useSpeechBlocks] Error deleting speech block:', err);
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
    createSpeechBlock,
    updateSpeechBlock,
    deleteSpeechBlock,
  };
}
