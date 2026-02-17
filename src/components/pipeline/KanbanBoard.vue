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
  <div class="overflow-x-auto pb-2" data-testid="kanban-board-scroll">
    <div class="flex min-w-max gap-4" data-testid="kanban-board">
      <div
        v-for="column in columns"
        :key="column.stage.key"
        class="w-[20rem] shrink-0"
        :data-testid="`kanban-board-column-${column.stage.key}`"
      >
        <KanbanColumn :stage="column.stage" :jobs="column.jobs" @drop="emit('move', $event)" />
      </div>
    </div>
  </div>
</template>
