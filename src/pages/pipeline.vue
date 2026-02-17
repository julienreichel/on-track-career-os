<script setup lang="ts">
import { useKanbanBoard } from '@/application/kanban/useKanbanBoard';
import KanbanBoard from '@/components/pipeline/KanbanBoard.vue';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import type { JobDescription } from '@/domain/job-description/JobDescription';

defineOptions({ name: 'PipelinePage' });

const { t } = useI18n();
const { pageError, pageErrorMessageKey, setPageError, clearPageError, notifyActionError } =
  useErrorDisplay();
const board = useKanbanBoard();
const searchQuery = ref('');

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

onMounted(() => {
  void load();
});
</script>

<template>
  <UPage>
    <UPageHeader :title="t('pipeline.title')" :description="t('pipeline.description')" />

    <UPageBody>
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

      <KanbanBoard v-else :columns="filteredColumns" @move="moveJob" />
    </UPageBody>
  </UPage>
</template>
