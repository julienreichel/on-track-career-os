import { ref } from 'vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';

export function useCompanyJobs(companyId: string) {
  const jobs = ref<JobDescription[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new JobDescriptionService();

  const load = async () => {
    if (!companyId) {
      jobs.value = [];
      return [];
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await service.listJobsByCompany(companyId);
      jobs.value = result;
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      return [];
    } finally {
      loading.value = false;
    }
  };

  return {
    jobs,
    loading,
    error,
    load,
  };
}
