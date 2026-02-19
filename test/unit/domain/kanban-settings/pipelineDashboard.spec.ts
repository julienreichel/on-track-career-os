import { describe, expect, it } from 'vitest';
import {
  computeStalled,
  derivePipelineBuckets,
  rankFocusJobs,
  toPipelineCounts,
} from '@/domain/kanban-settings/pipelineDashboard';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

const stages: KanbanStage[] = [
  { key: 'todo', name: 'Backlog', isSystemDefault: true },
  { key: 'applied', name: 'Applied', isSystemDefault: false },
  { key: 'done', name: 'Done', isSystemDefault: true },
] as KanbanStage[];

const buildJob = (overrides: Partial<JobDescription>): JobDescription =>
  ({
    id: 'job-1',
    title: 'Job',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-02T00:00:00.000Z',
    kanbanStatus: 'todo',
    ...overrides,
  }) as JobDescription;

describe('pipelineDashboard helpers', () => {
  it('falls back unknown kanbanStatus to todo bucket', () => {
    const buckets = derivePipelineBuckets(
      [buildJob({ id: 'unknown', kanbanStatus: 'mystery' })],
      stages
    );

    expect(buckets.todoJobs.map((job) => job.id)).toEqual(['unknown']);
    expect(buckets.activeJobs).toEqual([]);
    expect(buckets.doneJobs).toEqual([]);
  });

  it('buckets jobs into todo, active, and done with correct counts', () => {
    const buckets = derivePipelineBuckets(
      [
        buildJob({ id: 'todo-1', kanbanStatus: 'todo' }),
        buildJob({ id: 'active-1', kanbanStatus: 'applied' }),
        buildJob({ id: 'done-1', kanbanStatus: 'done' }),
      ],
      stages
    );

    expect(toPipelineCounts(buckets)).toEqual({
      todoCount: 1,
      activeCount: 1,
      doneCount: 1,
    });
  });

  it('ranks focus jobs with active first and stable ordering', () => {
    const buckets = derivePipelineBuckets(
      [
        buildJob({ id: 'todo-new', kanbanStatus: 'todo', updatedAt: '2026-02-12T00:00:00.000Z' }),
        buildJob({ id: 'active-tie-a', kanbanStatus: 'applied', updatedAt: '2026-02-10T00:00:00.000Z' }),
        buildJob({ id: 'active-tie-b', kanbanStatus: 'applied', updatedAt: '2026-02-10T00:00:00.000Z' }),
        buildJob({ id: 'active-new', kanbanStatus: 'applied', updatedAt: '2026-02-13T00:00:00.000Z' }),
      ],
      stages
    );

    const focus = rankFocusJobs(buckets);

    expect(focus.map((job) => job.id)).toEqual(['active-new', 'active-tie-a', 'active-tie-b']);
  });

  it('computes stalled jobs using threshold days', () => {
    const now = new Date('2026-02-20T00:00:00.000Z');
    const stalled = computeStalled(
      [
        buildJob({ id: 'old-1', updatedAt: '2026-02-10T00:00:00.000Z' }),
        buildJob({ id: 'fresh-1', updatedAt: '2026-02-18T00:00:00.000Z' }),
      ],
      now,
      7
    );

    expect(stalled.map((job) => job.id)).toEqual(['old-1']);
  });
});
