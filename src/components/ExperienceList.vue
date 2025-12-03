<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Experience } from '@/domain/experience/Experience';

const { t } = useI18n();

interface Props {
  experiences: Experience[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  edit: [id: string];
  delete: [id: string];
}>();

const columns = [
  {
    key: 'title',
    label: t('experiences.table.title'),
  },
  {
    key: 'companyName',
    label: t('experiences.table.company'),
  },
  {
    key: 'startDate',
    label: t('experiences.table.startDate'),
  },
  {
    key: 'endDate',
    label: t('experiences.table.endDate'),
  },
  {
    key: 'status',
    label: t('experiences.table.status'),
  },
  {
    key: 'actions',
    label: t('experiences.table.actions'),
  },
];

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return t('experiences.present');
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function getStatusBadge(status: string | null | undefined) {
  const statusValue = status || 'draft';
  return {
    draft: { color: 'gray' as const, label: t('experiences.status.draft') },
    complete: { color: 'green' as const, label: t('experiences.status.complete') },
  }[statusValue];
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ t('experiences.list.title') }}
        </h3>
        <UButton
          :label="t('experiences.list.addNew')"
          icon="i-heroicons-plus"
          size="sm"
          @click="$emit('edit', '')"
        />
      </div>
    </template>

    <UTable :columns="columns" :rows="experiences" :loading="loading">
      <template #title-data="{ row }">
        <div class="font-medium">{{ row.title }}</div>
      </template>

      <template #companyName-data="{ row }">
        <div>{{ row.companyName || '-' }}</div>
      </template>

      <template #startDate-data="{ row }">
        <div class="text-sm">{{ formatDate(row.startDate) }}</div>
      </template>

      <template #endDate-data="{ row }">
        <div class="text-sm">{{ formatDate(row.endDate) }}</div>
      </template>

      <template #status-data="{ row }">
        <UBadge
          :color="getStatusBadge(row.status)?.color"
          :label="getStatusBadge(row.status)?.label"
          size="xs"
        />
      </template>

      <template #actions-data="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-pencil"
            size="xs"
            color="gray"
            variant="ghost"
            :aria-label="t('experiences.list.edit')"
            @click="emit('edit', row.id)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="red"
            variant="ghost"
            :aria-label="t('experiences.list.delete')"
            @click="emit('delete', row.id)"
          />
        </div>
      </template>

      <template #empty-state>
        <div class="flex flex-col items-center gap-3 py-8">
          <UIcon name="i-heroicons-briefcase" class="h-12 w-12 text-gray-400" />
          <p class="text-sm text-gray-500">
            {{ t('experiences.list.empty') }}
          </p>
        </div>
      </template>
    </UTable>
  </UCard>
</template>
