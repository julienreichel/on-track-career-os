import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

export type PipelineBuckets = {
  todoJobs: JobDescription[];
  activeJobs: JobDescription[];
  doneJobs: JobDescription[];
};

export type PipelineCounts = {
  todoCount: number;
  activeCount: number;
  doneCount: number;
};

const FALLBACK_STAGE_KEY = 'todo';
const MILLISECONDS_PER_DAY = 86_400_000;

const toTimestamp = (value?: string | null): number => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const byMostRecentStable = (jobs: ReadonlyArray<JobDescription>): JobDescription[] =>
  jobs
    .map((job, index) => ({ job, index }))
    .sort((a, b) => {
      const aTime = toTimestamp(a.job.updatedAt ?? a.job.createdAt);
      const bTime = toTimestamp(b.job.updatedAt ?? b.job.createdAt);
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.job);

export const normalizeKanbanStatus = (
  job: Pick<JobDescription, 'kanbanStatus'>,
  stages: ReadonlyArray<KanbanStage>
): string => {
  const rawStatus = job.kanbanStatus?.trim();
  if (!rawStatus) {
    return FALLBACK_STAGE_KEY;
  }

  const knownStageKeys = new Set(stages.map((stage) => stage.key));
  if (knownStageKeys.size > 0 && !knownStageKeys.has(rawStatus)) {
    return FALLBACK_STAGE_KEY;
  }

  return rawStatus;
};

export const getStageLabel = (stageKey: string, stages: ReadonlyArray<KanbanStage>): string => {
  const normalizedKey = normalizeKanbanStatus({ kanbanStatus: stageKey }, stages);
  const stage = stages.find((entry) => entry.key === normalizedKey);
  return stage?.name?.trim() || normalizedKey;
};

export const derivePipelineBuckets = (
  jobs: ReadonlyArray<JobDescription>,
  stages: ReadonlyArray<KanbanStage>
): PipelineBuckets => {
  const todoJobs: JobDescription[] = [];
  const activeJobs: JobDescription[] = [];
  const doneJobs: JobDescription[] = [];

  jobs.forEach((job) => {
    const normalizedStatus = normalizeKanbanStatus(job, stages);
    if (normalizedStatus === 'done') {
      doneJobs.push(job);
      return;
    }
    if (normalizedStatus === 'todo') {
      todoJobs.push(job);
      return;
    }
    activeJobs.push(job);
  });

  return {
    todoJobs,
    activeJobs,
    doneJobs,
  };
};

export const rankFocusJobs = (buckets: PipelineBuckets, limit = 3): JobDescription[] => {
  const rankedActive = byMostRecentStable(buckets.activeJobs);
  const rankedTodo = byMostRecentStable(buckets.todoJobs);
  return [...rankedActive, ...rankedTodo].slice(0, Math.max(0, limit));
};

export const computeStalled = (
  jobs: ReadonlyArray<JobDescription>,
  now: Date,
  thresholdDays: number
): JobDescription[] => {
  const thresholdMs = Math.max(0, thresholdDays) * MILLISECONDS_PER_DAY;

  return byMostRecentStable(jobs).filter((job) => {
    const lastActivityTs = toTimestamp(job.updatedAt ?? job.createdAt);
    if (lastActivityTs === 0) {
      return false;
    }
    return now.getTime() - lastActivityTs >= thresholdMs;
  });
};

export const toPipelineCounts = (buckets: PipelineBuckets): PipelineCounts => ({
  todoCount: buckets.todoJobs.length,
  activeCount: buckets.activeJobs.length,
  doneCount: buckets.doneJobs.length,
});
