import { ref } from 'vue';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { Experience } from '@/domain/experience/Experience';

export function useExperience(id: string) {
  const item = ref<Experience | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new ExperienceService();

  const load = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      item.value = await service.getFullExperience(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useExperience] Error loading experience:', err);
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, error, load };
}
