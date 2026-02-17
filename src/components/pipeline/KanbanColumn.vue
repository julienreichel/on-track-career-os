<script setup lang="ts">
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import KanbanJobCard from '@/components/pipeline/KanbanJobCard.vue';

const props = defineProps<{
  stage: KanbanStage;
  jobs: JobDescription[];
}>();

const emit = defineEmits<{
  drop: [payload: { jobId: string; toStageKey: string }];
}>();

const { t } = useI18n();

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  const jobId = event.dataTransfer?.getData('text/plain');
  if (!jobId) {
    return;
  }
  emit('drop', { jobId, toStageKey: props.stage.key });
};

const allowDrop = (event: DragEvent) => {
  event.preventDefault();
};
</script>

<template>
  <UCard class="min-h-[16rem]" :data-testid="`kanban-column-${stage.key}`">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-semibold text-highlighted">{{ stage.name }}</h2>
        <UBadge color="neutral" variant="subtle">{{ jobs.length }}</UBadge>
      </div>
    </template>

    <div
      class="min-h-[12rem] space-y-3"
      :data-testid="`kanban-dropzone-${stage.key}`"
      @dragover="allowDrop"
      @drop="handleDrop"
    >
      <KanbanJobCard v-for="job in jobs" :key="job.id" :job="job" />

      <p v-if="jobs.length === 0" class="text-sm text-dimmed">
        {{ t('pipeline.column.empty') }}
      </p>
    </div>
  </UCard>
</template>
