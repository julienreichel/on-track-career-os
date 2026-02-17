<script setup lang="ts">
import type { KanbanColumn as KanbanColumnModel } from '@/application/kanban/useKanbanBoard';
import KanbanColumn from '@/components/pipeline/KanbanColumn.vue';

defineProps<{
  columns: KanbanColumnModel[];
}>();

const emit = defineEmits<{
  move: [payload: { jobId: string; toStageKey: string }];
}>();
</script>

<template>
  <UPageGrid class="grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" data-testid="kanban-board">
    <KanbanColumn
      v-for="column in columns"
      :key="column.stage.key"
      :stage="column.stage"
      :jobs="column.jobs"
      @drop="emit('move', $event)"
    />
  </UPageGrid>
</template>
