import { ref } from 'vue';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';

type JobServiceDependency = Pick<JobDescriptionService, 'updateJobNotes'>;

type NoteEditorContextReason = 'moved_to_done' | 'moved_stage' | 'manual';

export type NoteEditorContext = {
  stageName?: string;
  reason?: NoteEditorContextReason;
};

type UseKanbanNotesOptions = {
  jobService?: JobServiceDependency;
};

export const useKanbanNotes = (options: UseKanbanNotesOptions = {}) => {
  const jobService = options.jobService ?? new JobDescriptionService();

  const isOpen = ref(false);
  const jobId = ref<string | null>(null);
  const draft = ref('');
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const context = ref<NoteEditorContext | null>(null);

  const openNoteEditor = (
    nextJobId: string,
    payload: NoteEditorContext & { initialNotes?: string } = {}
  ) => {
    jobId.value = nextJobId;
    draft.value = payload.initialNotes ?? '';
    context.value = {
      stageName: payload.stageName,
      reason: payload.reason ?? 'manual',
    };
    error.value = null;
    isOpen.value = true;
  };

  const closeNoteEditor = () => {
    isOpen.value = false;
  };

  const saveNotes = async (nextJobId?: string, nextNotes?: string) => {
    const resolvedJobId = nextJobId ?? jobId.value;
    if (!resolvedJobId) {
      throw new Error('Job not selected');
    }

    const notes = nextNotes ?? draft.value;
    isSaving.value = true;
    error.value = null;

    try {
      const updated = await jobService.updateJobNotes(resolvedJobId, notes);
      draft.value = updated.notes ?? notes;
      isOpen.value = false;
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    state: {
      isOpen,
      jobId,
      draft,
      isSaving,
      error,
      context,
    },
    openNoteEditor,
    closeNoteEditor,
    saveNotes,
  };
};
