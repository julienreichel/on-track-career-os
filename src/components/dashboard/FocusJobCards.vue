<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import JobPreviewMiniCard from '@/components/dashboard/JobPreviewMiniCard.vue';

const PREVIEW_LIMIT = 3;

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
const hasJobs = computed(() => previewJobs.value.length > 0);
</script>

<template>
  <UCard data-testid="focus-jobs-card">
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">{{ t('dashboard.pipeline.focus.title') }}</h2>
          <p class="text-sm text-dimmed">{{ t('dashboard.pipeline.focus.description') }}</p>
        </div>
        <UButton
          :label="t('dashboard.pipeline.focus.cta.openPipeline')"
          to="/pipeline"
          color="neutral"
          variant="outline"
          size="sm"
          data-testid="focus-open-pipeline-link"
        />
      </div>
    </template>

    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-24 rounded-md" />
      <USkeleton class="h-24 rounded-md" />
      <USkeleton class="h-24 rounded-md" />
    </div>

    <div v-else-if="!hasJobs" class="text-sm text-dimmed" data-testid="focus-jobs-empty">
      {{ t('dashboard.pipeline.focus.empty') }}
    </div>

    <div v-else class="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <JobPreviewMiniCard
        v-for="job in previewJobs"
        :key="job.id"
        :job="job"
        :stages="stages"
        :enable-workflow-actions="true"
        :data-testid="`focus-job-card-${job.id}`"
        @move-to-stage="emit('moveToStage', $event)"
      />
    </div>
  </UCard>
</template>
