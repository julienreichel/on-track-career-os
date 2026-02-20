<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import { getStageLabel, normalizeKanbanStatus } from '@/domain/kanban-settings/pipelineDashboard';
import ItemCard from '@/components/ItemCard.vue';

type JobWithRelations = JobDescription & {
  company?: { companyName?: string | null } | null;
  cvs?: unknown;
  coverLetters?: unknown;
  speechBlocks?: unknown;
};

const props = defineProps<{
  job: JobDescription;
  stages: KanbanStage[];
  enableWorkflowActions?: boolean;
}>();
const emit = defineEmits<{
  moveToStage: [payload: { jobId: string; toStageKey: string }];
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
const stageKey = computed(() => normalizeKanbanStatus(props.job, props.stages));
const isTodo = computed(() => stageKey.value === 'todo');
const isDone = computed(() => stageKey.value === 'done');
const isActive = computed(() => !isTodo.value && !isDone.value);
const nextStageKey = computed(() => {
  const index = props.stages.findIndex((stage) => stage.key === stageKey.value);
  if (index < 0 || index >= props.stages.length - 1) {
    return null;
  }
  return props.stages[index + 1]?.key ?? null;
});
const showMoveNext = computed(
  () => props.enableWorkflowActions === true && Boolean(nextStageKey.value)
);
const nextStageLabel = computed(() => {
  if (!nextStageKey.value) {
    return null;
  }
  return getStageLabel(nextStageKey.value, props.stages);
});

const hasMaterialRelation = (value: unknown): boolean => {
  if (!value) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => Boolean(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items.some((item) => Boolean(item));
    }
    if (typeof record.id === 'string' && record.id.length > 0) {
      return true;
    }
  }
  return false;
};

const hasCv = computed(() => hasMaterialRelation((props.job as JobWithRelations).cvs));
const hasCoverLetter = computed(() =>
  hasMaterialRelation((props.job as JobWithRelations).coverLetters)
);
const hasSpeech = computed(() => hasMaterialRelation((props.job as JobWithRelations).speechBlocks));
const showGenerateCoverLetter = computed(
  () => props.enableWorkflowActions === true && isTodo.value && !hasCoverLetter.value
);
const showGenerateCv = computed(
  () =>
    props.enableWorkflowActions === true &&
    isTodo.value &&
    !hasCv.value &&
    hasCoverLetter.value
);

const handleMoveToNextStage = () => {
  if (!nextStageKey.value) {
    return;
  }
  emit('moveToStage', { jobId: props.job.id, toStageKey: nextStageKey.value });
};

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
      <UButton
        v-if="showGenerateCv"
        color="neutral"
        variant="outline"
        size="xs"
        :label="t('dashboard.pipeline.actions.generateCv')"
        :to="`/applications/cv/new?jobId=${job.id}`"
        :data-testid="`preview-generate-cv-link-${job.id}`"
      />
      <UButton
        v-if="showGenerateCoverLetter"
        color="neutral"
        variant="outline"
        size="xs"
        :label="t('dashboard.pipeline.actions.generateCoverLetter')"
        :to="`/applications/cover-letters/new?jobId=${job.id}`"
        :data-testid="`preview-generate-cover-letter-link-${job.id}`"
      />
      <UButton
        v-if="enableWorkflowActions && isActive && !hasSpeech"
        color="neutral"
        variant="outline"
        size="xs"
        :label="t('dashboard.pipeline.actions.generateSpeech')"
        :to="`/applications/speech/new?jobId=${job.id}`"
        :data-testid="`preview-generate-speech-link-${job.id}`"
      />
      <UButton
        v-if="showMoveNext && nextStageLabel"
        color="neutral"
        variant="outline"
        size="xs"
        :label="t('dashboard.pipeline.actions.moveToStage', { stage: nextStageLabel })"
        :data-testid="`preview-move-next-link-${job.id}`"
        @click="handleMoveToNextStage"
      />
    </template>
  </ItemCard>
</template>
