import { ref } from 'vue';
import type {
  JobDescription,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import { useAuthUser } from '@/composables/useAuthUser';

const jobs = ref<JobDescription[]>([]);
const selectedJob = ref<JobDescription | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

export function useJobAnalysis() {
  const service = new JobDescriptionService();
  const auth = useAuthUser(); // Move this to top level

  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      return await operation();
    } finally {
      loading.value = false;
    }
  };

  const handle = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await run(operation);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    }
  };

  const listJobs = async () => {
    const ownerId = await auth.getOwnerIdOrThrow();
    const result = await handle(() => service.listJobs(ownerId));
    jobs.value = result;
    return result;
  };

  const loadJob = async (jobId: string) => {
    const result = await handle(() => service.getFullJobDescription(jobId));
    selectedJob.value = result;
    return result;
  };

  const loadJobWithRelations = async (jobId: string) => {
    const result = await handle(() => service.getJobWithRelations(jobId));
    selectedJob.value = result;
    return result;
  };

  const createAnalyzedJobFromRawText = async (rawText: string) => {
    const ownerId = await auth.getOwnerIdOrThrow();
    const created = await handle(() => service.createAnalyzedJobFromRawText(rawText, ownerId));
    selectedJob.value = created;
    jobs.value = [created, ...jobs.value];
    return created;
  };

  const updateJob = async (jobId: string, patch: Partial<JobDescriptionUpdateInput>) => {
    const updated = await handle(() => service.updateJob(jobId, patch));
    selectedJob.value = updated;
    jobs.value = jobs.value.map((job) => (job.id === updated.id ? updated : job));
    return updated;
  };

  const deleteJob = async (jobId: string) => {
    await handle(() => service.deleteJob(jobId));
    jobs.value = jobs.value.filter((job) => job.id !== jobId);
    if (selectedJob.value?.id === jobId) {
      selectedJob.value = null;
    }
  };

  const resetState = () => {
    jobs.value = [];
    selectedJob.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    jobs,
    selectedJob,
    loading,
    error,
    listJobs,
    loadJob,
    loadJobWithRelations,
    createAnalyzedJobFromRawText,
    updateJob,
    deleteJob,
    resetState,
  };
}
