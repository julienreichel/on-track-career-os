import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKanbanNotes } from '@/application/kanban/useKanbanNotes';

describe('useKanbanNotes', () => {
  const updateJobNotes = vi.fn();
  const jobService = { updateJobNotes };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens editor with provided context and initial draft', () => {
    const notes = useKanbanNotes({ jobService });

    notes.openNoteEditor('job-1', {
      initialNotes: 'Initial note',
      stageName: 'Applied',
      reason: 'moved_stage',
    });

    expect(notes.state.isOpen.value).toBe(true);
    expect(notes.state.jobId.value).toBe('job-1');
    expect(notes.state.draft.value).toBe('Initial note');
    expect(notes.state.context.value).toEqual({
      stageName: 'Applied',
      reason: 'moved_stage',
    });
  });

  it('persists notes and closes editor', async () => {
    updateJobNotes.mockResolvedValue({ id: 'job-1', notes: 'Saved note' });
    const notes = useKanbanNotes({ jobService });
    notes.openNoteEditor('job-1', { initialNotes: 'Draft' });

    const updated = await notes.saveNotes();

    expect(updateJobNotes).toHaveBeenCalledWith('job-1', 'Draft');
    expect(updated.notes).toBe('Saved note');
    expect(notes.state.isOpen.value).toBe(false);
    expect(notes.state.draft.value).toBe('Saved note');
  });

  it('exposes deterministic error state on save failure', async () => {
    updateJobNotes.mockRejectedValue(new Error('save failed'));
    const notes = useKanbanNotes({ jobService });
    notes.openNoteEditor('job-1', { initialNotes: 'Draft' });

    await expect(notes.saveNotes()).rejects.toThrow('save failed');

    expect(notes.state.isOpen.value).toBe(true);
    expect(notes.state.error.value).toBe('save failed');
    expect(notes.state.isSaving.value).toBe(false);
  });
});
