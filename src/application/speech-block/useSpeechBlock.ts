import { ref } from 'vue';
import { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import type { SpeechBlock, SpeechBlockUpdateInput } from '@/domain/speech-block/SpeechBlock';

export function useSpeechBlock(id: string) {
  const item = ref<SpeechBlock | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new SpeechBlockService();

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      item.value = await service.getFullSpeechBlock(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useSpeechBlock] Error loading speechblock:', err);
    } finally {
      loading.value = false;
    }
  };

  const save = async (input: SpeechBlockUpdateInput) => {
    loading.value = true;
    error.value = null;

    try {
      const updated = await service.updateSpeechBlock(input);
      item.value = updated ?? item.value;
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useSpeechBlock] Error updating speechblock:', err);
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
      await service.deleteSpeechBlock(item.value.id);
      item.value = null;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useSpeechBlock] Error deleting speechblock:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, error, load, save, remove };
}
