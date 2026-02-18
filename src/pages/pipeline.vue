<script setup lang="ts">
import { useKanbanBoard, type KanbanMoveNoteRequest } from '@/application/kanban/useKanbanBoard';
import { useKanbanNotes } from '@/application/kanban/useKanbanNotes';
import KanbanBoard from '@/components/pipeline/KanbanBoard.vue';
import KanbanNoteEditor from '@/components/pipeline/KanbanNoteEditor.vue';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import { useUserProgress } from '@/composables/useUserProgress';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { GuidanceBanner as GuidanceBannerModel } from '@/domain/onboarding';

defineOptions({ name: 'PipelinePage' });

const { t } = useI18n();
const toast = useToast();
const { pageError, pageErrorMessageKey, setPageError, clearPageError, notifyActionError } =
  useErrorDisplay();
const searchQuery = ref('');
const kanbanNotes = useKanbanNotes();
const progress = useUserProgress();

const getJobById = (jobId: string) => board.jobs.value.find((job) => job.id === jobId);

const openNoteEditor = (
  jobId: string,
  context: { stageName?: string; reason?: 'moved_to_done' | 'moved_stage' | 'manual' } = {}
) => {
  const job = getJobById(jobId);
  if (!job) {
    return;
  }
  kanbanNotes.openNoteEditor(jobId, {
    initialNotes: job.notes ?? '',
    stageName: context.stageName,
    reason: context.reason ?? 'manual',
  });
};

const buildMoveNoteContextLine = (
  context: { stageName?: string; reason?: 'moved_to_done' | 'moved_stage' | 'manual' } | null
) => {
  if (!context?.stageName) {
    return '';
  }
  if (context.reason === 'moved_to_done') {
    return t('pipeline.notes.editor.contextDone', { stage: context.stageName });
  }
  if (context.reason === 'moved_stage') {
    return t('pipeline.notes.editor.contextMoved', { stage: context.stageName });
  }
  return '';
};

const handleMoveSuccess = (payload: KanbanMoveNoteRequest) => {
  const titleKey =
    payload.reason === 'moved_to_done'
      ? 'pipeline.notes.toast.movedDone'
      : 'pipeline.notes.toast.moved';

  const isDoneMove = payload.reason === 'moved_to_done';

  toast.add({
    title: t(titleKey, { stage: payload.toStageName ?? payload.toStageKey }),
    color: 'primary',
    actions: isDoneMove
      ? undefined
      : [
          {
            label: t('pipeline.notes.toast.addAction'),
            variant: 'outline',
            onClick: () => {
              openNoteEditor(payload.jobId, {
                stageName: payload.toStageName,
                reason: payload.reason,
              });
            },
          },
        ],
  });

  if (isDoneMove) {
    openNoteEditor(payload.jobId, {
      stageName: payload.toStageName,
      reason: payload.reason,
    });
  }
};

const board = useKanbanBoard({
  onMoveSuccess: handleMoveSuccess,
});

const filteredColumns = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return board.columns.value;
  }

  return board.columns.value.map((column) => ({
    ...column,
    jobs: column.jobs.filter((job) => matchesJobSearch(job, query)),
  }));
});

const hasFilteredJobs = computed(() =>
  filteredColumns.value.some((column) => column.jobs.length > 0)
);

const hasJobs = computed(() => board.jobs.value.length > 0);
const jobUploadBanner = computed<GuidanceBannerModel | null>(() => {
  if (!progress.state.value?.phase3.missing.includes('jobUploaded')) {
    return null;
  }

  return {
    titleKey: 'guidance.applications.banner.job.title',
    descriptionKey: 'guidance.applications.banner.job.description',
    cta: {
      labelKey: 'guidance.applications.banner.job.cta',
      to: '/jobs/new',
    },
  };
});

const matchesJobSearch = (job: JobDescription, query: string): boolean => {
  const fields = [job.title, job.seniorityLevel, job.roleSummary, job.status];
  return fields.some((field) => field?.toLowerCase().includes(query));
};

const load = async () => {
  clearPageError();
  try {
    await board.load();
  } catch (err) {
    setPageError(
      err instanceof Error ? err.message : t('pipeline.errors.load'),
      'pipeline.errors.load'
    );
  }
};

const moveJob = async (payload: { jobId: string; toStageKey: string }) => {
  try {
    await board.moveJob(payload.jobId, payload.toStageKey);
  } catch {
    notifyActionError({
      title: t('pipeline.errors.move'),
    });
  }
};

const saveNotes = async () => {
  try {
    const updated = await kanbanNotes.saveNotes();
    const job = getJobById(updated.id);
    if (job) {
      job.notes = updated.notes ?? '';
      board.jobs.value = [...board.jobs.value];
    }
    toast.add({
      title: t('pipeline.notes.toast.saved'),
      color: 'primary',
    });
  } catch {
    notifyActionError({
      title: t('pipeline.notes.toast.saveFailed'),
    });
  }
};

onMounted(() => {
  void load();
  void progress.load();
});
</script>

<template>
  <UPage>
    <UPageHeader :title="t('pipeline.title')" :description="t('pipeline.description')" />

    <UPageBody>
      <GuidanceBanner v-if="jobUploadBanner" :banner="jobUploadBanner" class="mb-6" />

      <div v-if="!board.isLoading.value && hasJobs" class="mb-6">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('pipeline.search.placeholder')"
          size="lg"
          class="w-1/3"
        />
      </div>

      <ErrorStateCard
        v-if="pageError"
        :title="t('common.error')"
        :description="t(pageErrorMessageKey || 'pipeline.errors.load')"
        :retry-label="t('common.retry')"
        @retry="load"
      />

      <ListSkeletonCards v-else-if="board.isLoading.value" />

      <UCard v-else-if="board.columns.value.length === 0">
        <p class="text-sm text-dimmed">{{ t('pipeline.empty') }}</p>
      </UCard>

      <UCard v-else-if="!hasFilteredJobs">
        <UEmpty :title="t('pipeline.search.noResults')" icon="i-heroicons-magnifying-glass">
          <p class="text-sm text-dimmed">
            {{ t('pipeline.search.placeholder') }}
          </p>
        </UEmpty>
      </UCard>

      <KanbanBoard
        v-else
        :columns="filteredColumns"
        @move="moveJob"
        @open-note="openNoteEditor($event.jobId)"
      />

      <KanbanNoteEditor
        :open="kanbanNotes.state.isOpen.value"
        :draft="kanbanNotes.state.draft.value"
        :is-saving="kanbanNotes.state.isSaving.value"
        :error="kanbanNotes.state.error.value"
        :context-line="buildMoveNoteContextLine(kanbanNotes.state.context.value)"
        @update:open="(value) => (value ? null : kanbanNotes.closeNoteEditor())"
        @update:draft="(value) => (kanbanNotes.state.draft.value = value)"
        @save="saveNotes"
      />
    </UPageBody>
  </UPage>
</template>
