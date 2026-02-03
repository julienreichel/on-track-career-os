<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Experience } from '@/domain/experience/Experience';

const props = defineProps<{
  experience: Experience;
  storyCount?: number;
}>();

const emit = defineEmits<{
  viewStories: [experienceId: string];
  edit: [experienceId: string];
  delete: [experienceId: string];
}>();

const { t } = useI18n();
const descriptionMaxLength = 180;

const title = computed(() => props.experience.title || t('experiences.card.noTitle'));

const subtitle = computed(() => props.experience.companyName || t('experiences.card.noCompany'));

const dateRange = computed(() => {
  const start = formatDate(props.experience.startDate);
  const end = formatDate(props.experience.endDate);
  return `${start} · ${end}`;
});

const description = computed(() => {
  const summary =
    getTextContent(props.experience.responsibilities?.filter((r): r is string => r !== null)) ||
    getTextContent(props.experience.tasks?.filter((t): t is string => t !== null));

  if (!summary) {
    return t('experiences.card.noSummary');
  }

  const trimmed = summary.trim();
  return trimmed.length > descriptionMaxLength
    ? `${trimmed.slice(0, descriptionMaxLength)}…`
    : trimmed;
});

const statusBadge = computed(() => {
  const status = props.experience.status || 'draft';
  return {
    color: status === 'complete' ? 'info' : 'neutral',
    label: status === 'complete' ? t('experiences.status.complete') : t('experiences.status.draft'),
  } as const;
});

const hasStories = computed(() => (props.storyCount ?? 0) > 0);

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return t('experiences.present');
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function handleViewStories() {
  emit('viewStories', props.experience.id);
}

function handleEdit() {
  emit('edit', props.experience.id);
}

function handleDelete() {
  emit('delete', props.experience.id);
}

function getTextContent(input: string | string[] | null | undefined) {
  if (!input) {
    return '';
  }

  if (Array.isArray(input)) {
    return input.filter(Boolean).join('. ');
  }

  return input;
}
</script>

<template>
  <div data-testid="experience-card">
    <ItemCard :title="title" :subtitle="subtitle" @edit="handleEdit" @delete="handleDelete">
      <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <div class="font-medium text-gray-900 dark:text-gray-100">
          {{ dateRange }}
        </div>
        <p class="line-clamp-4">
          {{ description }}
        </p>
      </div>

      <template #badges>
        <UBadge :color="statusBadge.color" variant="outline" size="xs">
          {{ statusBadge.label }} </UBadge
        ><UBadge color="neutral" variant="outline" size="xs">
          {{ t(`experiences.types.${experience.experienceType || 'work'}`) }}
        </UBadge>
        <UBadge
          v-if="hasStories"
          color="secondary"
          variant="outline"
          size="xs"
          icon="i-heroicons-document-text"
        >
          {{ storyCount }}
        </UBadge>
      </template>

      <template #actions>
        <UButton
          :label="t('common.view')"
          icon="i-heroicons-eye"
          size="xs"
          color="primary"
          variant="outline"
          class="cursor-pointer"
          @click.stop="handleEdit"
        />
        <UButton
          :label="t('experiences.list.actions.viewStories')"
          icon="i-heroicons-document-text"
          size="xs"
          color="neutral"
          variant="outline"
          class="cursor-pointer"
          @click.stop="handleViewStories"
        />
      </template>
    </ItemCard>
  </div>
</template>
