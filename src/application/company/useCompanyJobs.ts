import { ref } from 'vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { useAuthUser } from '@/composables/useAuthUser';

export function useCompanyJobs(companyId: string) {
  const jobs = ref<JobDescription[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const service = new JobDescriptionService();
  const auth = useAuthUser();

  const load = async () => {
    if (!companyId) {
      jobs.value = [];
      return [];
    }

    loading.value = true;
    error.value = null;
    try {
      const ownerId = await resolveOwnerId(auth);
      const result = await service.listJobsByCompany(companyId, ownerId);
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

async function resolveOwnerId(auth: ReturnType<typeof useAuthUser>) {
  if (auth.ownerId.value) {
    return auth.ownerId.value;
  }

  const ownerId = await auth.loadOwnerId();
  if (!ownerId) {
    throw new Error('Missing owner information');
  }

  return ownerId;
}
