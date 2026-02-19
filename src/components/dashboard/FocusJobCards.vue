<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import { getStageLabel, normalizeKanbanStatus } from '@/domain/kanban-settings/pipelineDashboard';
import ItemCard from '@/components/ItemCard.vue';

const PREVIEW_LIMIT = 3;

const props = defineProps<{
  jobs: JobDescription[];
  stages: KanbanStage[];
  loading?: boolean;
}>();

const { t } = useI18n();

const previewJobs = computed(() => props.jobs.slice(0, PREVIEW_LIMIT));
const hasJobs = computed(() => previewJobs.value.length > 0);
type JobWithRelations = JobDescription & {
  company?: { companyName?: string | null } | null;
};

const formatCreatedDate = (rawDate?: string | null): string => {
  if (!rawDate) {
    return t('dashboard.pipeline.focus.unknownDate');
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return t('dashboard.pipeline.focus.unknownDate');
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
};

const companyName = (job: JobDescription): string => {
  const relatedJob = job as JobWithRelations;
  return relatedJob.company?.companyName?.trim() || t('pipeline.card.noCompany');
};

const stageLabel = (job: JobDescription): string => {
  const normalizedKey = normalizeKanbanStatus(job, props.stages);
  return getStageLabel(normalizedKey, props.stages);
};
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
      <ItemCard
        v-for="job in previewJobs"
        :key="job.id"
        :data-testid="`focus-job-card-${job.id}`"
        :title="job.title || t('jobs.list.card.noTitle')"
        :subtitle="companyName(job)"
        :show-delete="false"
      >
        <template #badges>
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="primary" variant="outline" size="xs">
              {{ stageLabel(job) }}
            </UBadge>
          </div>
        </template>

        <p class="text-xs text-dimmed">
          {{ t('dashboard.pipeline.focus.updatedAt', { date: formatCreatedDate(job.updatedAt) }) }}
        </p>

        <p class="line-clamp-2 text-sm text-toned">
          {{ job.roleSummary || t('dashboard.pipeline.focus.noSummary') }}
        </p>

        <template #actions>
          <UButton
            color="neutral"
            variant="outline"
            size="xs"
            :label="t('dashboard.pipeline.focus.cta.viewJob')"
            :to="`/jobs/${job.id}`"
            :data-testid="`focus-view-job-link-${job.id}`"
          />
        </template>
      </ItemCard>
    </div>
  </UCard>
</template>
