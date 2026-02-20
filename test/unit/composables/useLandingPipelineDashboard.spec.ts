import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useLandingPipelineDashboard } from '@/composables/useLandingPipelineDashboard';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

const stages: KanbanStage[] = [
  { key: 'todo', name: 'Todo', isSystemDefault: true },
  { key: 'applied', name: 'Applied', isSystemDefault: false },
  { key: 'done', name: 'Done', isSystemDefault: true },
] as KanbanStage[];

const buildJob = (overrides: Partial<JobDescription>): JobDescription =>
  ({
    id: 'job',
    title: 'Role',
    kanbanStatus: 'todo',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-02T00:00:00.000Z',
    ...overrides,
  }) as JobDescription;

const createDashboard = (jobs: JobDescription[]) => {
  const listJobs = vi.fn().mockResolvedValue(jobs);
  const updateJob = vi.fn().mockImplementation(async (jobId: string, patch: { kanbanStatus?: string }) => ({
    id: jobId,
    ...jobs.find((job) => job.id === jobId),
    kanbanStatus: patch.kanbanStatus ?? 'todo',
    updatedAt: '2026-02-21T00:00:00.000Z',
  }));
  const loadKanban = vi.fn().mockResolvedValue(stages);

  return {
    dashboard: useLandingPipelineDashboard({
      jobAnalysis: {
        jobs: ref(jobs),
        listJobs,
        updateJob,
        error: ref<string | null>(null),
      },
      kanbanSettings: {
        state: {
          stages: ref(stages),
          isLoading: ref(false),
          error: ref<string | null>(null),
        },
        load: loadKanban,
      },
      now: () => new Date('2026-02-20T00:00:00.000Z'),
      stalledThresholdDays: 7,
    }),
    listJobs,
    updateJob,
    loadKanban,
  };
};

describe('useLandingPipelineDashboard', () => {
  it('returns empty viewState when there are no jobs', () => {
    const { dashboard } = createDashboard([]);
    expect(dashboard.viewState.value).toBe('empty');
  });

  it('returns todoOnly viewState when only todo jobs exist', () => {
    const { dashboard } = createDashboard([buildJob({ id: 'todo-1', kanbanStatus: 'todo' })]);
    expect(dashboard.viewState.value).toBe('todoOnly');
  });

  it('returns active viewState when any active job exists', () => {
    const { dashboard } = createDashboard([buildJob({ id: 'active-1', kanbanStatus: 'applied' })]);
    expect(dashboard.viewState.value).toBe('active');
  });

  it('returns allDone viewState when all jobs are done', () => {
    const { dashboard } = createDashboard([buildJob({ id: 'done-1', kanbanStatus: 'done' })]);
    expect(dashboard.viewState.value).toBe('allDone');
  });

  it('loads jobs and kanban settings through existing dependencies', async () => {
    const { dashboard, listJobs, loadKanban } = createDashboard([]);

    await dashboard.load();

    expect(loadKanban).toHaveBeenCalledTimes(1);
    expect(listJobs).toHaveBeenCalledTimes(1);
  });

  it('moves a job to another stage and updates local state', async () => {
    const { dashboard, updateJob } = createDashboard([buildJob({ id: 'job-1', kanbanStatus: 'todo' })]);

    await dashboard.moveJobToStage('job-1', 'done');

    expect(updateJob).toHaveBeenCalledWith('job-1', { kanbanStatus: 'done' });
    expect(dashboard.todoJobsPreview.value).toHaveLength(0);
    expect(dashboard.counts.value.doneCount).toBe(1);
  });

  it('assigns jobs exclusively across stalled, focus, and todo sections', () => {
    const { dashboard } = createDashboard([
      buildJob({
        id: 'stalled-active',
        kanbanStatus: 'applied',
        updatedAt: '2026-02-01T00:00:00.000Z',
      }),
      buildJob({
        id: 'stalled-todo',
        kanbanStatus: 'todo',
        updatedAt: '2026-02-02T00:00:00.000Z',
      }),
      buildJob({
        id: 'focus-active',
        kanbanStatus: 'applied',
        updatedAt: '2026-02-19T00:00:00.000Z',
      }),
      buildJob({
        id: 'focus-todo',
        kanbanStatus: 'todo',
        updatedAt: '2026-02-18T00:00:00.000Z',
      }),
      buildJob({
        id: 'focus-todo-2',
        kanbanStatus: 'todo',
        updatedAt: '2026-02-17T00:00:00.000Z',
      }),
      buildJob({
        id: 'todo-only',
        kanbanStatus: 'todo',
        updatedAt: '2026-02-16T00:00:00.000Z',
      }),
    ]);

    const stalledIds = dashboard.stalledJobsPreview.value.map((job) => job.id);
    const focusIds = dashboard.focusJobs.value.map((job) => job.id);
    const todoIds = dashboard.todoJobsPreview.value.map((job) => job.id);
    const allIds = [...stalledIds, ...focusIds, ...todoIds];

    expect(new Set(allIds).size).toBe(allIds.length);
    expect(stalledIds).toEqual(['stalled-todo', 'stalled-active']);
    expect(focusIds).toEqual(['focus-active', 'focus-todo', 'focus-todo-2']);
    expect(todoIds).toEqual(['todo-only']);
  });
});
