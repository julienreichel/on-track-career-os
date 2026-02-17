<script setup lang="ts">
import type { JobDescription } from '@/domain/job-description/JobDescription';

const { t } = useI18n();

const props = defineProps<{
  job: JobDescription;
}>();

const emit = defineEmits<{
  dragstart: [jobId: string];
  dragend: [];
  'open-note': [payload: { jobId: string }];
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
const companyName = computed(
  () => relatedJob.value.company?.companyName ?? t('pipeline.card.noCompany')
);
const hasNotes = computed(() => Boolean(props.job.notes?.trim()));
const notesPreview = computed(() => props.job.notes?.trim() ?? '');

const score = computed(() => {
  const rawSummaries = relatedJob.value.matchingSummaries;
  const summaries: MatchingSummaryLite[] = [];
  if (Array.isArray(rawSummaries)) {
    for (const summary of rawSummaries) {
      if (summary) {
        summaries.push(summary);
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

const handleOpenNote = () => {
  emit('open-note', { jobId: props.job.id });
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

      <p
        v-if="hasNotes"
        class="line-clamp-2 text-xs text-toned"
        :data-testid="`kanban-note-preview-${job.id}`"
      >
        {{ notesPreview }}
      </p>

      <div class="flex justify-end pt-1">
        <UButton
          color="neutral"
          variant="outline"
          size="xs"
          icon="i-heroicons-chat-bubble-left-right"
          :title="hasNotes ? t('pipeline.card.editNote') : t('pipeline.card.addNote')"
          :aria-label="hasNotes ? t('pipeline.card.editNote') : t('pipeline.card.addNote')"
          :data-testid="`kanban-note-button-${job.id}`"
          @click.stop="handleOpenNote"
        />
      </div>
    </div>
  </UCard>
</template>
