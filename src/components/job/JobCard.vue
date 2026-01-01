<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemCard from '@/components/ItemCard.vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const props = defineProps<{
  job: JobDescription;
  showDelete?: boolean;
}>();

const emit = defineEmits<{
  open: [jobId: string];
  delete: [jobId: string];
}>();

const { t } = useI18n();

const title = computed(() => props.job.title || t('jobList.card.noTitle'));
const subtitle = computed(() => props.job.seniorityLevel || t('jobList.card.noSeniority'));

const createdAt = computed(() => {
  if (!props.job.createdAt) {
    return '';
  }
  const date = new Date(props.job.createdAt);
  if (Number.isNaN(date.getTime())) {
    return props.job.createdAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
});

const statusBadge = computed(() => {
  const status = props.job.status || 'draft';
  const color = status === 'complete' ? 'success' : status === 'analyzed' ? 'primary' : 'neutral';
  return {
    color,
    label: t(`jobList.status.${status}`),
  };
});

const canViewMatch = computed(() => props.job.status === 'analyzed');
const matchLink = computed(() => `/jobs/${props.job.id}/match`);

function handleOpen() {
  emit('open', props.job.id);
}

function handleDelete() {
  emit('delete', props.job.id);
}
</script>

<template>
  <ItemCard
    data-testid="job-card"
    :title="title"
    :subtitle="subtitle"
    :show-delete="props.showDelete !== false"
    @edit="handleOpen"
    @delete="handleDelete"
  >
    <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
      <p v-if="createdAt" class="font-medium text-gray-900 dark:text-gray-100">
        {{ t('jobList.card.created', { date: createdAt }) }}
      </p>
      <p v-if="job.roleSummary" class="line-clamp-4">
        {{ job.roleSummary }}
      </p>
      <p v-else class="text-gray-500">
        {{ t('jobUpload.description') }}
      </p>
    </div>

    <template #badges>
      <UBadge :color="statusBadge.color" variant="soft" size="xs">
        {{ statusBadge.label }}
      </UBadge>
    </template>

    <template #actions>
      <UButton
        :label="t('jobList.actions.view')"
        icon="i-heroicons-eye"
        size="xs"
        color="primary"
        variant="soft"
        @click.stop="handleOpen"
      />
      <UButton
        :label="t('jobList.actions.match')"
        icon="i-heroicons-sparkles"
        size="xs"
        color="secondary"
        variant="soft"
        data-testid="job-card-match"
        :to="matchLink"
        :disabled="!canViewMatch"
      />
    </template>
  </ItemCard>
</template>
