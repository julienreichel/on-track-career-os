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
  const loadKanban = vi.fn().mockResolvedValue(stages);

  return {
    dashboard: useLandingPipelineDashboard({
      jobAnalysis: {
        jobs: ref(jobs),
        listJobs,
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
});
