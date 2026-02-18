<script setup lang="ts">
import type { KanbanColumn as KanbanColumnModel } from '@/application/kanban/useKanbanBoard';
import KanbanColumn from '@/components/pipeline/KanbanColumn.vue';

defineProps<{
  columns: KanbanColumnModel[];
}>();

const emit = defineEmits<{
  move: [payload: { jobId: string; toStageKey: string }];
  'open-note': [payload: { jobId: string }];
}>();
</script>

<template>
  <div class="overflow-x-auto pb-2" data-testid="kanban-board-scroll">
    <div class="flex min-w-max items-stretch gap-4" data-testid="kanban-board">
      <div
        v-for="column in columns"
        :key="column.stage.key"
        class="flex w-[20rem] shrink-0"
        :data-testid="`kanban-board-column-${column.stage.key}`"
      >
        <KanbanColumn
          class="h-full w-full"
          :stage="column.stage"
          :jobs="column.jobs"
          @drop="emit('move', $event)"
          @open-note="emit('open-note', $event)"
        />
      </div>
    </div>
  </div>
</template>
