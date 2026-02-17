import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useKanbanSettings } from '@/application/kanban-settings/useKanbanSettings';
import type { KanbanSettingsService } from '@/domain/kanban-settings/KanbanSettingsService';

describe('useKanbanSettings', () => {
  const auth = {
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  };

  let service: KanbanSettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = {
      getOrCreateKanbanSettings: vi.fn(),
      updateKanbanStages: vi.fn(),
    } as unknown as KanbanSettingsService;
  });

  it('loads defaults when service result is missing', async () => {
    (service.getOrCreateKanbanSettings as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { state, load } = useKanbanSettings({ auth, service });
    await load();

    expect(state.stages.value.map((stage) => stage.key)).toEqual([
      'todo',
      'applied',
      'interview',
      'done',
    ]);
  });

  it('saves stages via service and keeps system stages', async () => {
    (service.updateKanbanStages as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      userId: 'user-1',
      stages: [
        { key: 'todo', name: 'ToDo', isSystemDefault: true },
        { key: 'review', name: 'Review', isSystemDefault: false },
        { key: 'done', name: 'Done', isSystemDefault: true },
      ],
    });

    const { save } = useKanbanSettings({ auth, service });
    const saved = await save([{ key: 'review', name: 'Review', isSystemDefault: false }]);

    expect(service.updateKanbanStages).toHaveBeenCalledWith('user-1', [
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'review', name: 'Review', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ]);
    expect(saved.map((stage) => stage.key)).toEqual(['todo', 'review', 'done']);
  });

  it('supports add/remove/move/rename mutations', () => {
    const { state, addStage, removeStage, moveStage, renameStage } = useKanbanSettings({
      auth,
      service,
    });

    state.stages.value = [
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'review', name: 'Review', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ];

    addStage('Review');
    expect(state.stages.value.map((stage) => stage.key)).toContain('review-2');

    renameStage('review', 'Screening');
    expect(state.stages.value.find((stage) => stage.key === 'review')?.name).toBe('Screening');

    removeStage('todo');
    expect(state.stages.value.some((stage) => stage.key === 'todo')).toBe(true);

    moveStage(1, 2);
    expect(state.stages.value.map((stage) => stage.key)).toEqual([
      'todo',
      'review-2',
      'review',
      'done',
    ]);
  });
});
