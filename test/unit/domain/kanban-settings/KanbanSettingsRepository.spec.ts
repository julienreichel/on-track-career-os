import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KanbanSettingsRepository } from '@/domain/kanban-settings/KanbanSettingsRepository';
import { getDefaultKanbanStages } from '@/domain/kanban-settings/kanbanStages';

describe('KanbanSettingsRepository', () => {
  let repository: KanbanSettingsRepository;
  const model = {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new KanbanSettingsRepository(model);
  });

  it('returns existing settings from getOrCreateKanbanSettings', async () => {
    model.get.mockResolvedValue({
      data: { id: 'user-1', userId: 'user-1', stages: getDefaultKanbanStages() },
    });

    const result = await repository.getOrCreateKanbanSettings('user-1');

    expect(model.get).toHaveBeenCalledWith({ id: 'user-1' }, expect.any(Object));
    expect(model.create).not.toHaveBeenCalled();
    expect(result?.id).toBe('user-1');
  });

  it('creates defaults when settings are missing', async () => {
    model.get.mockResolvedValue({ data: null });
    model.create.mockResolvedValue({
      data: { id: 'user-1', userId: 'user-1', stages: getDefaultKanbanStages() },
    });

    const result = await repository.getOrCreateKanbanSettings('user-1');

    expect(model.create).toHaveBeenCalledWith(
      {
        id: 'user-1',
        userId: 'user-1',
        stages: getDefaultKanbanStages(),
      },
      expect.any(Object)
    );
    expect(result?.stages).toEqual(getDefaultKanbanStages());
  });

  it('re-applies system stages when existing settings are invalid', async () => {
    model.get.mockResolvedValue({
      data: {
        id: 'user-1',
        userId: 'user-1',
        stages: [{ key: 'applied', name: 'Applied', isSystemDefault: false }],
      },
    });
    model.update.mockResolvedValue({
      data: {
        id: 'user-1',
        userId: 'user-1',
        stages: [
          { key: 'todo', name: 'ToDo', isSystemDefault: true },
          { key: 'applied', name: 'Applied', isSystemDefault: false },
          { key: 'done', name: 'Done', isSystemDefault: true },
        ],
      },
    });

    const result = await repository.getOrCreateKanbanSettings('user-1');

    expect(model.update).toHaveBeenCalledWith(
      {
        id: 'user-1',
        userId: 'user-1',
        stages: [
          { key: 'todo', name: 'ToDo', isSystemDefault: true },
          { key: 'applied', name: 'Applied', isSystemDefault: false },
          { key: 'done', name: 'Done', isSystemDefault: true },
        ],
      },
      expect.any(Object)
    );
    expect(result?.stages).toHaveLength(3);
  });

  it('guards updateKanbanStages and keeps todo/done even if removed', async () => {
    model.get.mockResolvedValue({
      data: { id: 'user-1', userId: 'user-1', stages: getDefaultKanbanStages() },
    });
    model.update.mockResolvedValue({
      data: {
        id: 'user-1',
        userId: 'user-1',
        stages: [
          { key: 'todo', name: 'ToDo', isSystemDefault: true },
          { key: 'interview', name: 'Interview', isSystemDefault: false },
          { key: 'done', name: 'Done', isSystemDefault: true },
        ],
      },
    });

    const result = await repository.updateKanbanStages('user-1', [
      { key: 'interview', name: 'Interview', isSystemDefault: false },
    ]);

    expect(result?.stages).toEqual([
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'interview', name: 'Interview', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ]);
  });

  it('throws when userId is empty', async () => {
    await expect(repository.getOrCreateKanbanSettings('')).rejects.toThrow('userId is required');
  });
});
