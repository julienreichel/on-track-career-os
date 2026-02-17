<script setup lang="ts">
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import {
  addKanbanStage,
  moveKanbanStage,
  removeKanbanStage,
  renameKanbanStage,
} from '@/domain/kanban-settings/kanbanStageMutations';

const { t } = useI18n();

const props = defineProps<{
  stages: KanbanStage[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:stages': [value: KanbanStage[]];
}>();

const newStageName = ref('');

const handleAddStage = () => {
  const updated = addKanbanStage(props.stages, newStageName.value);
  if (JSON.stringify(updated) === JSON.stringify(props.stages)) {
    return;
  }
  newStageName.value = '';
  emit('update:stages', updated);
};

const handleRemoveStage = (key: string) => {
  const updated = removeKanbanStage(props.stages, key);
  if (JSON.stringify(updated) === JSON.stringify(props.stages)) {
    return;
  }
  emit('update:stages', updated);
};

const handleMoveStage = (from: number, to: number) => {
  const updated = moveKanbanStage(props.stages, from, to);
  if (JSON.stringify(updated) === JSON.stringify(props.stages)) {
    return;
  }
  emit('update:stages', updated);
};

const handleRenameStage = (key: string, name: string) => {
  const updated = renameKanbanStage(props.stages, key, name);
  if (JSON.stringify(updated) === JSON.stringify(props.stages)) {
    return;
  }
  emit('update:stages', updated);
};
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h2 class="text-lg font-semibold text-default">{{ t('settings.kanban.editor.title') }}</h2>
        <p class="text-sm text-dimmed">{{ t('settings.kanban.editor.description') }}</p>
      </div>
    </template>

    <div class="space-y-3">
      <div
        v-for="(stage, index) in stages"
        :key="stage.key"
        class="flex items-center gap-2"
        :data-testid="`kanban-stage-row-${stage.key}`"
      >
        <div class="flex items-center gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-chevron-up"
            :disabled="disabled || index === 0 || stage.isSystemDefault"
            :aria-label="t('settings.kanban.editor.actions.moveUp')"
            :data-testid="`kanban-stage-move-up-${stage.key}`"
            @click="handleMoveStage(index, index - 1)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-chevron-down"
            :disabled="disabled || index === stages.length - 1 || stage.isSystemDefault"
            :aria-label="t('settings.kanban.editor.actions.moveDown')"
            :data-testid="`kanban-stage-move-down-${stage.key}`"
            @click="handleMoveStage(index, index + 1)"
          />
        </div>

        <UInput
          :model-value="stage.name"
          :disabled="disabled"
          class="flex-1"
          :data-testid="`kanban-stage-name-${stage.key}`"
          @update:model-value="handleRenameStage(stage.key, String($event ?? ''))"
        />

        <UButton
          color="error"
          variant="ghost"
          icon="i-heroicons-trash"
          :disabled="disabled || stage.isSystemDefault"
          :aria-label="t('settings.kanban.editor.actions.remove')"
          :data-testid="`kanban-stage-delete-${stage.key}`"
          @click="handleRemoveStage(stage.key)"
        />
      </div>

      <UFormField :label="t('settings.kanban.editor.addLabel')">
        <div class="flex items-center gap-2">
          <UInput
            v-model="newStageName"
            :disabled="disabled"
            :placeholder="t('settings.kanban.editor.addPlaceholder')"
            class="flex-1"
            data-testid="kanban-stage-add-input"
            @keydown.enter.prevent="handleAddStage"
          />
          <UButton
            color="primary"
            variant="outline"
            :label="t('settings.kanban.editor.actions.add')"
            :disabled="disabled || !newStageName.trim()"
            data-testid="kanban-stage-add-button"
            @click="handleAddStage"
          />
        </div>
      </UFormField>
    </div>
  </UCard>
</template>
