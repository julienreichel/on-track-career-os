import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useKanbanBoard } from '@/application/kanban/useKanbanBoard';
import type { JobDescription } from '@/domain/job-description/JobDescription';

describe('useKanbanBoard', () => {
  const auth = {
    getOwnerIdOrThrow: vi.fn().mockResolvedValue('user-1::user-1'),
  };

  const stagesRef = ref([
    { key: 'todo', name: 'ToDo', isSystemDefault: true },
    { key: 'applied', name: 'Applied', isSystemDefault: false },
    { key: 'done', name: 'Done', isSystemDefault: true },
  ]);

  const kanbanSettings = {
    state: {
      stages: stagesRef,
      isLoading: ref(false),
      error: ref(null),
    },
    load: vi.fn().mockResolvedValue(stagesRef.value),
  };

  const listJobs = vi.fn();
  const updateJob = vi.fn();
  const jobService = {
    listJobs,
    updateJob,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups jobs by configured stage order', async () => {
    listJobs.mockResolvedValue([
      { id: 'job-1', title: 'A', kanbanStatus: 'applied' },
      { id: 'job-2', title: 'B', kanbanStatus: 'todo' },
    ] as JobDescription[]);

    const board = useKanbanBoard({
      auth,
      jobService,
      kanbanSettings,
    });
    await board.load();

    expect(board.columns.value.map((column) => column.stage.key)).toEqual(['todo', 'applied', 'done']);
    expect(board.columns.value[0]?.jobs.map((job) => job.id)).toEqual(['job-2']);
    expect(board.columns.value[1]?.jobs.map((job) => job.id)).toEqual(['job-1']);
  });

  it('falls back unknown status to todo', async () => {
    listJobs.mockResolvedValue([{ id: 'job-1', title: 'A', kanbanStatus: 'mystery' }] as JobDescription[]);

    const board = useKanbanBoard({
      auth,
      jobService,
      kanbanSettings,
    });
    await board.load();

    expect(board.columns.value[0]?.jobs.map((job) => job.id)).toEqual(['job-1']);
    expect(board.columns.value[1]?.jobs).toEqual([]);
  });

  it('optimistically moves and rolls back on persistence failure', async () => {
    listJobs.mockResolvedValue([{ id: 'job-1', title: 'A', kanbanStatus: 'todo' }] as JobDescription[]);
    updateJob.mockRejectedValue(new Error('save failed'));

    const board = useKanbanBoard({
      auth,
      jobService,
      kanbanSettings,
    });
    await board.load();

    await expect(board.moveJob('job-1', 'applied')).rejects.toThrow('save failed');

    expect(board.columns.value[0]?.jobs.map((job) => job.id)).toEqual(['job-1']);
    expect(board.columns.value[1]?.jobs).toEqual([]);
  });
});
