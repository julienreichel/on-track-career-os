<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import JobPreviewMiniCard from '@/components/dashboard/JobPreviewMiniCard.vue';

const PREVIEW_LIMIT = 2;

const props = defineProps<{
  jobs: JobDescription[];
  stages: KanbanStage[];
  loading?: boolean;
}>();
const emit = defineEmits<{
  moveToStage: [payload: { jobId: string; toStageKey: string }];
}>();

const { t } = useI18n();
const previewJobs = computed(() => props.jobs.slice(0, PREVIEW_LIMIT));
</script>

<template>
  <UCard data-testid="todo-preview-section">
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">{{ t('dashboard.pipeline.todoPreview.title') }}</h2>
          <p class="text-sm text-dimmed">{{ t('dashboard.pipeline.todoPreview.description') }}</p>
        </div>
        <UButton
          :label="t('dashboard.pipeline.todoPreview.cta.openPipeline')"
          to="/pipeline"
          color="neutral"
          variant="outline"
          size="sm"
          data-testid="todo-preview-open-pipeline-link"
        />
      </div>
    </template>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2">
      <USkeleton class="h-28 rounded-md" />
      <USkeleton class="h-28 rounded-md" />
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <JobPreviewMiniCard
        v-for="job in previewJobs"
        :key="job.id"
        :job="job"
        :stages="stages"
        :enable-workflow-actions="true"
        :data-testid="`todo-preview-job-${job.id}`"
        @move-to-stage="emit('moveToStage', $event)"
      />
    </div>
  </UCard>
</template>
