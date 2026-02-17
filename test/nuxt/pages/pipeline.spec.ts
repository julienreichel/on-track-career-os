import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../utils/createTestI18n';
import PipelinePage from '@/pages/pipeline.vue';
import type { KanbanColumn } from '@/application/kanban/useKanbanBoard';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const i18n = createTestI18n();

const jobsRef = ref<JobDescription[]>([]);
const columnsRef = ref<KanbanColumn[]>([]);
const isLoadingRef = ref(false);
const mockLoad = vi.fn(async () => jobsRef.value);
const mockMoveJob = vi.fn();
const boardOptionsRef = ref<Record<string, unknown> | null>(null);

vi.mock('@/application/kanban/useKanbanBoard', () => ({
  useKanbanBoard: (options?: Record<string, unknown>) => {
    boardOptionsRef.value = options ?? null;
    return {
      jobs: jobsRef,
      columns: columnsRef,
      isLoading: isLoadingRef,
      error: ref(null),
      load: mockLoad,
      moveJob: mockMoveJob,
      requestNoteForMove: vi.fn(),
    };
  },
}));

const notesIsOpenRef = ref(false);
const notesJobIdRef = ref<string | null>(null);
const notesDraftRef = ref('');
const notesSavingRef = ref(false);
const notesErrorRef = ref<string | null>(null);
const notesContextRef = ref<{
  stageName?: string;
  reason?: 'moved_to_done' | 'moved_stage' | 'manual';
} | null>(null);
const mockOpenNoteEditor = vi.fn(
  (
    jobId: string,
    payload: { initialNotes?: string; stageName?: string; reason?: 'moved_to_done' | 'moved_stage' | 'manual' } = {}
  ) => {
    notesIsOpenRef.value = true;
    notesJobIdRef.value = jobId;
    notesDraftRef.value = payload.initialNotes ?? '';
    notesContextRef.value = {
      stageName: payload.stageName,
      reason: payload.reason ?? 'manual',
    };
  }
);
const mockCloseNoteEditor = vi.fn(() => {
  notesIsOpenRef.value = false;
});
const mockSaveNotes = vi.fn();

vi.mock('@/application/kanban/useKanbanNotes', () => ({
  useKanbanNotes: () => ({
    state: {
      isOpen: notesIsOpenRef,
      jobId: notesJobIdRef,
      draft: notesDraftRef,
      isSaving: notesSavingRef,
      error: notesErrorRef,
      context: notesContextRef,
    },
    openNoteEditor: mockOpenNoteEditor,
    closeNoteEditor: mockCloseNoteEditor,
    saveNotes: mockSaveNotes,
  }),
}));

const toastAdd = vi.fn();

const pageErrorRef = ref<string | null>(null);
const pageErrorMessageKeyRef = ref<string | null>(null);
const setPageError = vi.fn();
const clearPageError = vi.fn(() => {
  pageErrorRef.value = null;
  pageErrorMessageKeyRef.value = null;
});
const notifyActionError = vi.fn();

vi.mock('@/composables/useErrorDisplay', () => ({
  useErrorDisplay: () => ({
    pageError: pageErrorRef,
    pageErrorMessageKey: pageErrorMessageKeyRef,
    setPageError,
    clearPageError,
    notifyActionError,
  }),
}));

const makeJob = (id: string, title: string): JobDescription => ({
  id,
  title,
  seniorityLevel: 'Senior',
  roleSummary: `${title} summary`,
  responsibilities: [],
  requiredSkills: [],
  behaviours: [],
  successCriteria: [],
  explicitPains: [],
  status: 'analyzed',
  rawText: 'raw',
  owner: 'owner-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
});

const setupBoardData = () => {
  const jobA = makeJob('job-1', 'Frontend engineer');
  const jobB = makeJob('job-2', 'Backend architect');
  jobsRef.value = [jobA, jobB];
  columnsRef.value = [
    { stage: { key: 'todo', name: 'ToDo', isSystemDefault: true }, jobs: [jobA] },
    { stage: { key: 'done', name: 'Done', isSystemDefault: true }, jobs: [jobB] },
  ];
};

describe('pipeline page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('useToast', () => ({
      add: toastAdd,
    }));
    boardOptionsRef.value = null;
    pageErrorRef.value = null;
    pageErrorMessageKeyRef.value = null;
    isLoadingRef.value = false;
    notesIsOpenRef.value = false;
    notesJobIdRef.value = null;
    notesDraftRef.value = '';
    notesSavingRef.value = false;
    notesErrorRef.value = null;
    notesContextRef.value = null;
    setupBoardData();
  });

  it('filters kanban cards from search input', async () => {
    const wrapper = mount(PipelinePage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div><slot /></div>' },
          UPageBody: { template: '<div><slot /></div>' },
          UCard: { template: '<div><slot /></div>' },
          UEmpty: { template: '<div class="empty"><slot /></div>' },
          UInput: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template:
              '<input class="search-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          ErrorStateCard: { template: '<div class="error-state" />' },
          ListSkeletonCards: { template: '<div class="skeleton" />' },
          KanbanBoard: {
            props: ['columns'],
            template: '<div class="board">{{ columns.flatMap((column) => column.jobs).length }}</div>',
          },
          KanbanNoteEditor: { template: '<div class="note-editor-stub" />' },
        },
      },
    });

    await flushPromises();

    expect(mockLoad).toHaveBeenCalled();
    expect(wrapper.find('.board').text()).toBe('2');

    await wrapper.find('.search-input').setValue('frontend');
    expect(wrapper.find('.board').text()).toBe('1');
  });

  it('shows no-results empty state when search has no matches', async () => {
    const wrapper = mount(PipelinePage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div><slot /></div>' },
          UPageBody: { template: '<div><slot /></div>' },
          UCard: { template: '<div><slot /></div>' },
          UEmpty: {
            props: ['title'],
            template: '<div class="empty">{{ title }}</div>',
          },
          UInput: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template:
              '<input class="search-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          ErrorStateCard: { template: '<div class="error-state" />' },
          ListSkeletonCards: { template: '<div class="skeleton" />' },
          KanbanBoard: {
            props: ['columns'],
            template: '<div class="board">{{ columns.length }}</div>',
          },
          KanbanNoteEditor: { template: '<div class="note-editor-stub" />' },
        },
      },
    });

    await flushPromises();
    await wrapper.find('.search-input').setValue('no-match-query');

    expect(wrapper.find('.board').exists()).toBe(false);
    expect(wrapper.find('.empty').text()).toContain(i18n.global.t('pipeline.search.noResults'));
  });

  it('opens note editor automatically for done-stage move prompt', async () => {
    mockMoveJob.mockImplementation(async () => {
      const callback = boardOptionsRef.value?.onMoveSuccess as
        | ((payload: {
            jobId: string;
            fromStageKey: string;
            toStageKey: string;
            toStageName?: string;
            reason: 'moved_to_done' | 'moved_stage';
          }) => void)
        | undefined;
      callback?.({
        jobId: 'job-1',
        fromStageKey: 'applied',
        toStageKey: 'done',
        toStageName: 'Done',
        reason: 'moved_to_done',
      });
    });

    const wrapper = mount(PipelinePage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div><slot /></div>' },
          UPageBody: { template: '<div><slot /></div>' },
          UCard: { template: '<div><slot /></div>' },
          UEmpty: { template: '<div class="empty"><slot /></div>' },
          UInput: { template: '<input />' },
          ErrorStateCard: { template: '<div class="error-state" />' },
          ListSkeletonCards: { template: '<div class="skeleton" />' },
          KanbanBoard: {
            emits: ['move'],
            template:
              '<button class="move-trigger" @click="$emit(\'move\', { jobId: \'job-1\', toStageKey: \'done\' })">move</button>',
          },
          KanbanNoteEditor: { template: '<div class="note-editor-stub" />' },
        },
      },
    });

    await flushPromises();
    await wrapper.find('.move-trigger').trigger('click');
    await flushPromises();

    expect(mockOpenNoteEditor).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({ stageName: 'Done', reason: 'moved_to_done' })
    );
  });
});
