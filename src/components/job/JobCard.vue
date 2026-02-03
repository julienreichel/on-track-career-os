<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemCard from '@/components/ItemCard.vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import { formatListDate } from '@/utils/formatListDate';

const props = defineProps<{
  job: JobDescription;
  showDelete?: boolean;
}>();

const emit = defineEmits<{
  open: [jobId: string];
  delete: [jobId: string];
}>();

const { t } = useI18n();

const title = computed(() => props.job.title || t('jobs.list.card.noTitle'));
const subtitle = computed(() => props.job.seniorityLevel || t('jobs.list.card.noSeniority'));

const lastUpdated = computed(() => formatListDate(props.job.updatedAt ?? props.job.createdAt));

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
      <p v-if="lastUpdated" class="font-medium text-gray-900 dark:text-gray-100">
        {{ lastUpdated }}
      </p>
      <p v-if="job.roleSummary" class="line-clamp-4">
        {{ job.roleSummary }}
      </p>
      <p v-else class="text-gray-500">
        {{ t('ingestion.job.upload.description') }}
      </p>
    </div>

    <template #actions>
      <UButton
        :label="t('common.view')"
        icon="i-heroicons-eye"
        size="xs"
        color="primary"
        variant="outline"
        @click.stop="handleOpen"
      />
      <UButton
        :label="t('jobs.list.actions.match')"
        icon="i-heroicons-sparkles"
        size="xs"
        color="neutral"
        variant="outline"
        data-testid="job-card-match"
        :to="matchLink"
      />
    </template>
  </ItemCard>
</template>
