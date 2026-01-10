<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableColumn } from '@nuxt/ui';
import type { Experience } from '@/domain/experience/Experience';

const { t } = useI18n();

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

interface Props {
  experiences: Experience[];
  storyCounts?: Record<string, number>;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  storyCounts: () => ({}),
});

const emit = defineEmits<{
  edit: [id: string];
  delete: [id: string];
  viewStories: [id: string];
  newStory: [id: string];
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
    accessorKey: 'experienceType',
    header: t('experiences.table.type'),
    cell: ({ row }) => {
      const type = row.original.experienceType || 'work';
      const badge = getTypeBadge(type);
      return h(UBadge, {
        color: badge?.color,
        label: badge?.label,
        size: 'xs',
      });
    },
  },
  {
    accessorKey: 'startDate',
    header: t('experiences.table.startDate'),
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: 'endDate',
    header: t('experiences.table.endDate'),
    cell: ({ row }) => formatDate(row.original.endDate),
  },
  {
    accessorKey: 'status',
    header: t('experiences.table.status'),
    cell: ({ row }) => {
      const badge = getStatusBadge(row.original.status);
      return h(UBadge, {
        color: badge?.color,
        label: badge?.label,
        size: 'xs',
      });
    },
  },
  {
    id: 'stories',
    header: t('experiences.table.stories'),
    cell: ({ row }) => {
      const count = props.storyCounts?.[row.original.id] ?? 0;
      return h(UBadge, {
        color: count > 0 ? 'primary' : 'neutral',
        label: `${count}`,
        size: 'xs',
      });
    },
  },
  {
    id: 'actions',
    header: t('experiences.table.actions'),
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-document-text',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          'aria-label': t('experiences.list.viewStories'),
          onClick: () => emit('viewStories', row.original.id),
        }),
        h(UButton, {
          icon: 'i-heroicons-plus-circle',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          'aria-label': t('experiences.list.newStory'),
          onClick: () => emit('newStory', row.original.id),
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          'aria-label': t('experiences.list.edit'),
          onClick: () => emit('edit', row.original.id),
        }),
        h(UButton, {
          icon: 'i-heroicons-trash',
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          'aria-label': t('experiences.list.delete'),
          onClick: () => emit('delete', row.original.id),
        }),
      ]);
    },
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

function getTypeBadge(type: string) {
  return {
    work: { color: 'primary' as const, label: t('experiences.types.work') },
    education: { color: 'blue' as const, label: t('experiences.types.education') },
    volunteer: { color: 'primary' as const, label: t('experiences.types.volunteer') },
    project: { color: 'purple' as const, label: t('experiences.types.project') },
  }[type as 'work' | 'education' | 'volunteer' | 'project'];
}
</script>

<template>
  <UCard>
    <template #header>
      <UPageHeader
        :title="t('experiences.list.title')"
        :links="[
          {
            label: t('experiences.list.addNew'),
            icon: 'i-heroicons-plus',
            onClick: () => emit('edit', ''),
          },
        ]"
      />
    </template>

    <UTable :columns="columns" :data="experiences" :loading="loading">
      <template #empty>
        <UEmpty icon="i-heroicons-briefcase" :description="t('experiences.list.empty')" />
      </template>
    </UTable>
  </UCard>
</template>
