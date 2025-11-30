import { ref } from 'vue';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { Experience } from '@/domain/experience/Experience';

export function useExperience(id: string) {
  const item = ref<Experience | null>(null);
  const loading = ref(false);
  const service = new ExperienceService();

  const load = async () => {
    loading.value = true;
    try {
      item.value = await service.getFullExperience(id);
    } finally {
      loading.value = false;
    }
  };

  return { item, loading, load };
}
