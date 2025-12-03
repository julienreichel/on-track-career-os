<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { TableColumn } from '@nuxt/ui';
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

const columns: TableColumn<Experience>[] = [
  {
    accessorKey: 'title',
    header: t('experiences.table.title'),
  },
  {
    accessorKey: 'companyName',
    header: t('experiences.table.company'),
  },
  {
    accessorKey: 'startDate',
    header: t('experiences.table.startDate'),
  },
  {
    accessorKey: 'endDate',
    header: t('experiences.table.endDate'),
  },
  {
    accessorKey: 'status',
    header: t('experiences.table.status'),
  },
  {
    accessorKey: 'actions',
    header: t('experiences.table.actions'),
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
    draft: { color: 'neutral' as const, label: t('experiences.status.draft') },
    complete: { color: 'success' as const, label: t('experiences.status.complete') },
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

    <UTable :columns="columns" :data="experiences" :loading="loading">
      <template #title-data="{ row }">
        <div class="font-medium">{{ row.original.title }}</div>
      </template>

      <template #companyName-data="{ row }">
        <div>{{ row.original.companyName || '-' }}</div>
      </template>

      <template #startDate-data="{ row }">
        <div class="text-sm">{{ formatDate(row.original.startDate) }}</div>
      </template>

      <template #endDate-data="{ row }">
        <div class="text-sm">{{ formatDate(row.original.endDate) }}</div>
      </template>

      <template #status-data="{ row }">
        <UBadge
          :color="getStatusBadge(row.original.status)?.color"
          :label="getStatusBadge(row.original.status)?.label"
          size="xs"
        />
      </template>

      <template #actions-data="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-pencil"
            size="xs"
            color="neutral"
            variant="ghost"
            :aria-label="t('experiences.list.edit')"
            @click="emit('edit', row.original.id)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="error"
            variant="ghost"
            :aria-label="t('experiences.list.delete')"
            @click="emit('delete', row.original.id)"
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
