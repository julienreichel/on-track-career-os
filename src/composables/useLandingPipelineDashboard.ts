import { computed, ref } from 'vue';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useKanbanSettings } from '@/application/kanban-settings/useKanbanSettings';
import {
  computeStalled,
  derivePipelineBuckets,
  rankFocusJobs,
  toPipelineCounts,
  type PipelineCounts,
} from '@/domain/kanban-settings/pipelineDashboard';
import type { JobDescription } from '@/domain/job-description/JobDescription';

type JobAnalysisDependency = Pick<
  ReturnType<typeof useJobAnalysis>,
  'jobs' | 'listJobs' | 'updateJob' | 'error'
>;
type KanbanSettingsDependency = Pick<ReturnType<typeof useKanbanSettings>, 'state' | 'load'>;

export type LandingPipelineViewState = 'empty' | 'todoOnly' | 'active' | 'allDone';

type UseLandingPipelineDashboardOptions = {
  jobAnalysis?: JobAnalysisDependency;
  kanbanSettings?: KanbanSettingsDependency;
  now?: () => Date;
  stalledThresholdDays?: number;
};

const DEFAULT_STALLED_THRESHOLD_DAYS = 7;
const FOCUS_PREVIEW_LIMIT = 3;
const TODO_PREVIEW_LIMIT = 2;
const STALLED_PREVIEW_LIMIT = 2;

const takePreview = (jobs: ReadonlyArray<JobDescription>, limit: number): JobDescription[] =>
  jobs.slice(0, Math.max(0, limit));

const toIdSet = (jobs: ReadonlyArray<JobDescription>): Set<string> =>
  new Set(jobs.map((job) => job.id));

const excludeJobsByIds = (
  jobs: ReadonlyArray<JobDescription>,
  excludedIds: ReadonlySet<string>
): JobDescription[] => jobs.filter((job) => !excludedIds.has(job.id));

export const useLandingPipelineDashboard = (options: UseLandingPipelineDashboardOptions = {}) => {
  const jobAnalysis = options.jobAnalysis ?? useJobAnalysis();
  const kanbanSettings = options.kanbanSettings ?? useKanbanSettings();
  const now = options.now ?? (() => new Date());
  const stalledThresholdDays = options.stalledThresholdDays ?? DEFAULT_STALLED_THRESHOLD_DAYS;

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const buckets = computed(() =>
    derivePipelineBuckets(jobAnalysis.jobs.value ?? [], kanbanSettings.state.stages.value ?? [])
  );

  const counts = computed<PipelineCounts>(() => toPipelineCounts(buckets.value));

  const stalledJobs = computed(() =>
    computeStalled([...buckets.value.activeJobs, ...buckets.value.todoJobs], now(), stalledThresholdDays)
  );

  const stalledJobsPreview = computed(() => takePreview(stalledJobs.value, STALLED_PREVIEW_LIMIT));
  const stalledPreviewIds = computed(() => toIdSet(stalledJobsPreview.value));

  const focusCandidates = computed(() =>
    rankFocusJobs(buckets.value, buckets.value.activeJobs.length + buckets.value.todoJobs.length)
  );
  const focusJobs = computed(() =>
    takePreview(excludeJobsByIds(focusCandidates.value, stalledPreviewIds.value), FOCUS_PREVIEW_LIMIT)
  );
  const focusJobIds = computed(() => toIdSet(focusJobs.value));

  const todoExcludedIds = computed(() => new Set([...stalledPreviewIds.value, ...focusJobIds.value]));
  const todoJobsPreview = computed(() =>
    takePreview(excludeJobsByIds(buckets.value.todoJobs, todoExcludedIds.value), TODO_PREVIEW_LIMIT)
  );
  const activeJobsPreview = computed(() => takePreview(buckets.value.activeJobs, FOCUS_PREVIEW_LIMIT));

  const viewState = computed<LandingPipelineViewState>(() => {
    const total = counts.value.todoCount + counts.value.activeCount + counts.value.doneCount;
    if (total === 0) {
      return 'empty';
    }
    if (counts.value.doneCount === total) {
      return 'allDone';
    }
    if (counts.value.activeCount > 0) {
      return 'active';
    }
    return 'todoOnly';
  });

  const load = async () => {
    if (isLoading.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      await Promise.all([kanbanSettings.load(), jobAnalysis.listJobs()]);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const moveJobToStage = async (jobId: string, toStageKey: string) => {
    const nextKey = toStageKey?.trim();
    if (!jobId || !nextKey) {
      throw new Error('Invalid move payload');
    }

    const updated = await jobAnalysis.updateJob(jobId, { kanbanStatus: nextKey });
    const target = jobAnalysis.jobs.value.find((job) => job.id === jobId);
    if (!target) {
      return updated;
    }

    target.kanbanStatus = updated.kanbanStatus ?? nextKey;
    jobAnalysis.jobs.value = [...jobAnalysis.jobs.value];
    return updated;
  };

  return {
    isLoading,
    error,
    counts,
    focusJobs,
    todoJobsPreview,
    activeJobsPreview,
    stalledJobsPreview,
    viewState,
    load,
    moveJobToStage,
  };
};
