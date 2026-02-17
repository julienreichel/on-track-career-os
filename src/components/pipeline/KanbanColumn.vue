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
const hasJobs = computed(() => props.jobs.length > 0);
const PAGE_SIZE = 5;
const visibleCount = ref(PAGE_SIZE);
const visibleJobs = computed(() => props.jobs.slice(0, visibleCount.value));
const hasMoreJobs = computed(() => props.jobs.length > visibleCount.value);

watch(
  () => props.jobs.length,
  () => {
    if (visibleCount.value < PAGE_SIZE) {
      visibleCount.value = PAGE_SIZE;
    }
    if (visibleCount.value > props.jobs.length) {
      visibleCount.value = Math.max(PAGE_SIZE, props.jobs.length);
    }
  }
);

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
      <template v-if="hasJobs">
        <KanbanJobCard v-for="job in visibleJobs" :key="job.id" :job="job" />

        <UButton
          v-if="hasMoreJobs"
          color="neutral"
          variant="outline"
          :label="t('pipeline.column.showMore')"
          :data-testid="`kanban-show-more-${stage.key}`"
          @click="visibleCount += PAGE_SIZE"
        />
      </template>
      <p v-else class="text-sm text-dimmed" :data-testid="`kanban-empty-${stage.key}`">
        {{ t('pipeline.column.empty') }}
      </p>

      <div
        v-if="hasJobs"
        class="h-24 rounded-md border border-dashed border-muted/60 bg-muted/10"
        :data-testid="`kanban-drop-tail-${stage.key}`"
        @dragover.stop.prevent="allowDrop"
        @drop.stop="handleDrop"
      />
    </div>
  </UCard>
</template>
