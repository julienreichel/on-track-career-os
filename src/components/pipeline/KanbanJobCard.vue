<script setup lang="ts">
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { formatListDate } from '@/utils/formatListDate';

const { t } = useI18n();

const props = defineProps<{
  job: JobDescription;
}>();

const emit = defineEmits<{
  dragstart: [jobId: string];
  dragend: [];
}>();

type MatchingSummaryLite = {
  overallScore?: number | null;
  updatedAt?: string | null;
  generatedAt?: string | null;
  createdAt?: string | null;
};

type JobWithRelations = JobDescription & {
  company?: { companyName?: string | null } | null;
  matchingSummaries?: (MatchingSummaryLite | null)[] | null;
};

const relatedJob = computed<JobWithRelations>(() => props.job as JobWithRelations);
const createdDate = computed(() => formatListDate(props.job.createdAt));
const companyName = computed(
  () => relatedJob.value.company?.companyName ?? t('pipeline.card.noCompany')
);

const score = computed(() => {
  const rawSummaries = relatedJob.value.matchingSummaries;
  const summaries: MatchingSummaryLite[] = [];
  if (Array.isArray(rawSummaries)) {
    for (const summary of rawSummaries) {
      if (summary) {
        summaries.push(summary as MatchingSummaryLite);
      }
    }
  }

  const best = summaries.reduce<MatchingSummaryLite | null>((latest, summary) => {
    if (!latest) {
      return summary;
    }
    const latestTs = new Date(latest.updatedAt ?? latest.generatedAt ?? latest.createdAt ?? 0).getTime();
    const summaryTs = new Date(
      summary.updatedAt ?? summary.generatedAt ?? summary.createdAt ?? 0
    ).getTime();
    return summaryTs > latestTs ? summary : latest;
  }, null);

  if (!best || typeof best.overallScore !== 'number') {
    return null;
  }

  return Math.round(best.overallScore);
});

const handleDragStart = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', props.job.id);
    event.dataTransfer.effectAllowed = 'move';
  }
  emit('dragstart', props.job.id);
};
</script>

<template>
  <UCard
    class="cursor-grab active:cursor-grabbing"
    draggable="true"
    :data-testid="`kanban-job-card-${job.id}`"
    @dragstart="handleDragStart"
    @dragend="emit('dragend')"
  >
    <div class="space-y-2">
      <div class="flex items-start justify-between gap-2">
        <NuxtLink :to="`/jobs/${job.id}`" class="font-medium text-highlighted hover:underline">
          {{ job.title || t('jobs.list.card.noTitle') }}
        </NuxtLink>
        <UBadge v-if="score !== null" color="primary" variant="subtle">
          {{ t('pipeline.card.matchScore', { score }) }}
        </UBadge>
      </div>

      <p class="text-sm text-dimmed">{{ companyName }}</p>

      <p v-if="createdDate" class="text-xs text-dimmed">
        {{ t('pipeline.card.createdAt', { date: createdDate }) }}
      </p>
    </div>
  </UCard>
</template>
