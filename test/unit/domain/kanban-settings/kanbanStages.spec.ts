import { describe, it, expect } from 'vitest';
import {
  ensureSystemStages,
  getDefaultKanbanStages,
  sanitizeStages,
} from '@/domain/kanban-settings/kanbanStages';

describe('kanbanStages', () => {
  it('returns default stages for missing settings', () => {
    expect(getDefaultKanbanStages()).toEqual([
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'applied', name: 'Applied', isSystemDefault: false },
      { key: 'interview', name: 'Interview', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ]);
  });

  it('sanitizeStages keeps unique keys and preserves first occurrence order', () => {
    const sanitized = sanitizeStages([
      { key: ' Applied ', name: 'Applied', isSystemDefault: false },
      { key: 'applied', name: 'Duplicate Applied', isSystemDefault: false },
      { name: 'Interview Stage', isSystemDefault: false },
      { key: 'Done', name: 'Done', isSystemDefault: false },
      null,
      undefined,
    ]);

    expect(sanitized).toEqual([
      { key: 'applied', name: 'Applied', isSystemDefault: false },
      { key: 'interview-stage', name: 'Interview Stage', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: false },
    ]);
  });

  it('ensureSystemStages always enforces todo and done as system defaults', () => {
    const ensured = ensureSystemStages([{ key: 'applied', name: 'Applied', isSystemDefault: true }]);

    expect(ensured).toEqual([
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'applied', name: 'Applied', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ]);
  });

  it('ensureSystemStages restores locked defaults even if tampered', () => {
    const ensured = ensureSystemStages([
      { key: 'todo', name: 'My Todo', isSystemDefault: false },
      { key: 'done', name: 'Finished', isSystemDefault: false },
      { key: 'interview', name: 'Interview', isSystemDefault: false },
    ]);

    expect(ensured).toEqual([
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'done', name: 'Done', isSystemDefault: true },
      { key: 'interview', name: 'Interview', isSystemDefault: false },
    ]);
  });
});
