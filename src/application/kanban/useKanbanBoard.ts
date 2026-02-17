import { computed, ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { useKanbanSettings } from '@/application/kanban-settings/useKanbanSettings';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

type AuthDependency = Pick<ReturnType<typeof useAuthUser>, 'getOwnerIdOrThrow'>;

type JobServiceDependency = Pick<JobDescriptionService, 'listJobs' | 'updateJob'>;

type KanbanSettingsDependency = Pick<ReturnType<typeof useKanbanSettings>, 'state' | 'load'>;

type UseKanbanBoardOptions = {
  auth?: AuthDependency;
  jobService?: JobServiceDependency;
  kanbanSettings?: KanbanSettingsDependency;
};

export type KanbanColumn = {
  stage: KanbanStage;
  jobs: JobDescription[];
};

const resolveFallbackStageKey = (stages: readonly KanbanStage[]): string =>
  stages.find((stage) => stage.key === 'todo')?.key ?? stages[0]?.key ?? 'todo';

export const normalizeJobStatus = (
  job: Pick<JobDescription, 'kanbanStatus'>,
  stages: readonly KanbanStage[]
): string => {
  const validKeys = new Set(stages.map((stage) => stage.key));
  const fallback = resolveFallbackStageKey(stages);
  if (!job.kanbanStatus || !validKeys.has(job.kanbanStatus)) {
    return fallback;
  }
  return job.kanbanStatus;
};

export const useKanbanBoard = (options: UseKanbanBoardOptions = {}) => {
  const auth = options.auth ?? useAuthUser();
  const jobService = options.jobService ?? new JobDescriptionService();
  const kanbanSettings = options.kanbanSettings ?? useKanbanSettings();

  const jobs = ref<JobDescription[]>([]);
  const loadingJobs = ref(false);
  const error = ref<string | null>(null);

  const columns = computed<KanbanColumn[]>(() => {
    const stages = kanbanSettings.state.stages.value;
    const grouped = new Map<string, JobDescription[]>();
    stages.forEach((stage) => grouped.set(stage.key, []));

    jobs.value.forEach((job) => {
      const normalizedStatus = normalizeJobStatus(job, stages);
      const bucket = grouped.get(normalizedStatus);
      if (bucket) {
        bucket.push(job);
      }
    });

    return stages.map((stage) => ({
      stage,
      jobs: grouped.get(stage.key) ?? [],
    }));
  });

  const isLoading = computed(() => loadingJobs.value || kanbanSettings.state.isLoading.value);

  const load = async () => {
    loadingJobs.value = true;
    error.value = null;

    try {
      await kanbanSettings.load();
      const ownerId = await auth.getOwnerIdOrThrow();
      jobs.value = await jobService.listJobs(ownerId);
      return jobs.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      loadingJobs.value = false;
    }
  };

  const moveJob = async (jobId: string, toStageKey: string) => {
    const stages = kanbanSettings.state.stages.value;
    const validStageKeys = new Set(stages.map((stage) => stage.key));
    if (!validStageKeys.has(toStageKey)) {
      throw new Error('Invalid stage key');
    }

    const targetJob = jobs.value.find((job) => job.id === jobId);
    if (!targetJob) {
      throw new Error('Job not found');
    }

    const previousKanbanStatus = targetJob.kanbanStatus ?? null;
    const currentStageKey = normalizeJobStatus(targetJob, stages);
    if (currentStageKey === toStageKey) {
      return targetJob;
    }

    jobs.value = jobs.value.map((job) =>
      job.id === jobId
        ? {
            ...job,
            kanbanStatus: toStageKey,
          }
        : job
    );

    try {
      const updated = await jobService.updateJob(jobId, { kanbanStatus: toStageKey });
      jobs.value = jobs.value.map((job) => (job.id === jobId ? updated : job));
      return updated;
    } catch (err) {
      jobs.value = jobs.value.map((job) =>
        job.id === jobId
          ? {
              ...job,
              kanbanStatus: previousKanbanStatus,
            }
          : job
      );
      throw err;
    }
  };

  return {
    jobs,
    columns,
    isLoading,
    error,
    load,
    moveJob,
    normalizeJobStatus: (job: Pick<JobDescription, 'kanbanStatus'>) =>
      normalizeJobStatus(job, kanbanSettings.state.stages.value),
  };
};
