import { ref } from 'vue';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';

export function useSTARStory(id: string) {
  const item = ref<STARStory | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new STARStoryService();

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      item.value = await service.getFullSTARStory(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useSTARStory] Error loading starstory:', err);
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, error, load };
}
