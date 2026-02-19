<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { PipelineCounts } from '@/domain/kanban-settings/pipelineDashboard';

defineProps<{
  counts: PipelineCounts;
  loading?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <UCard data-testid="pipeline-summary-bar">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{{ t('dashboard.pipeline.summary.title') }}</h2>
        <p class="text-sm text-dimmed">{{ t('dashboard.pipeline.summary.description') }}</p>
      </div>
    </template>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-3">
      <USkeleton class="h-16 rounded-md" />
      <USkeleton class="h-16 rounded-md" />
      <USkeleton class="h-16 rounded-md" />
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-lg border border-default p-3" data-testid="pipeline-summary-todo">
        <p class="text-xs uppercase tracking-wide text-dimmed">
          {{ t('dashboard.pipeline.summary.todo') }}
        </p>
        <p class="mt-1 text-2xl font-semibold">{{ counts.todoCount }}</p>
      </div>
      <div class="rounded-lg border border-default p-3" data-testid="pipeline-summary-active">
        <p class="text-xs uppercase tracking-wide text-dimmed">
          {{ t('dashboard.pipeline.summary.active') }}
        </p>
        <p class="mt-1 text-2xl font-semibold">{{ counts.activeCount }}</p>
      </div>
      <div class="rounded-lg border border-default p-3" data-testid="pipeline-summary-done">
        <p class="text-xs uppercase tracking-wide text-dimmed">
          {{ t('dashboard.pipeline.summary.done') }}
        </p>
        <p class="mt-1 text-2xl font-semibold">{{ counts.doneCount }}</p>
      </div>
    </div>
  </UCard>
</template>
