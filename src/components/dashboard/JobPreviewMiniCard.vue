<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import { getStageLabel, normalizeKanbanStatus } from '@/domain/kanban-settings/pipelineDashboard';
import ItemCard from '@/components/ItemCard.vue';

type JobWithRelations = JobDescription & {
  company?: { companyName?: string | null } | null;
};

const props = defineProps<{
  job: JobDescription;
  stages: KanbanStage[];
}>();

const { t } = useI18n();

const companyName = computed(() => {
  const relatedJob = props.job as JobWithRelations;
  return relatedJob.company?.companyName?.trim() || t('pipeline.card.noCompany');
});

const stageName = computed(() => {
  const normalizedKey = normalizeKanbanStatus(props.job, props.stages);
  return getStageLabel(normalizedKey, props.stages);
});

const updatedLabel = computed(() => {
  const rawDate = props.job.updatedAt ?? props.job.createdAt;
  if (!rawDate) {
    return t('dashboard.pipeline.focus.unknownDate');
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return t('dashboard.pipeline.focus.unknownDate');
  }

  const formatted = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);

  return t('dashboard.pipeline.focus.updatedAt', { date: formatted });
});
</script>

<template>
  <ItemCard
    :title="job.title || t('jobs.list.card.noTitle')"
    :subtitle="companyName"
    :show-delete="false"
  >
    <template #badges>
      <UBadge color="primary" variant="outline" size="xs">
        {{ stageName }}
      </UBadge>
    </template>

    <p class="text-xs text-dimmed">
      {{ updatedLabel }}
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
        :data-testid="`preview-view-job-link-${job.id}`"
      />
    </template>
  </ItemCard>
</template>
