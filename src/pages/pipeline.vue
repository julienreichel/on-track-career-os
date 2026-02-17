<script setup lang="ts">
import { useKanbanBoard } from '@/application/kanban/useKanbanBoard';
import KanbanBoard from '@/components/pipeline/KanbanBoard.vue';
import ErrorStateCard from '@/components/common/ErrorStateCard.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import { useErrorDisplay } from '@/composables/useErrorDisplay';

defineOptions({ name: 'PipelinePage' });

const { t } = useI18n();
const { pageError, pageErrorMessageKey, setPageError, clearPageError, notifyActionError } =
  useErrorDisplay();
const board = useKanbanBoard();

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

      <KanbanBoard v-else :columns="board.columns.value" @move="moveJob" />
    </UPageBody>
  </UPage>
</template>
