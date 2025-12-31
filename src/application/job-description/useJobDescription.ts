import { ref } from 'vue';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescription } from '@/domain/job-description/JobDescription';

export function useJobDescription(id: string) {
  const item = ref<JobDescription | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const linking = ref(false);
  const service = new JobDescriptionService();

  const load = async () => {
    loading.value = true;
    error.value = null;

    try {
      item.value = await service.getFullJobDescription(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[useJobDescription] Error loading jobdescription:', err);
    } finally {
      loading.value = false;
    }
  };

  const updateCompanyLink = async (companyId: string | null) => {
    linking.value = true;
    error.value = null;
    try {
      const updated = await service.updateJob(id, { companyId });
      item.value = updated;
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      linking.value = false;
    }
  };

  const linkCompany = (companyId: string) => updateCompanyLink(companyId);
  const clearCompanyLink = () => updateCompanyLink(null);

  return { item, loading, error, linking, load, linkCompany, clearCompanyLink };
}
