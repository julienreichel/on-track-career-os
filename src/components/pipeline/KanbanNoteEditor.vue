<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  draft: string;
  isSaving?: boolean;
  error?: string | null;
  contextLine?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:draft': [value: string];
  save: [];
}>();

const { t } = useI18n();

const close = () => {
  emit('update:open', false);
};
</script>

<template>
  <UModal :open="props.open" :title="t('pipeline.notes.editor.title')" @update:open="close">
    <template #body>
      <div class="space-y-3">
        <p v-if="contextLine" class="text-sm text-dimmed" data-testid="kanban-note-context">
          {{ contextLine }}
        </p>

        <UFormField :label="t('pipeline.notes.editor.label')">
          <UTextarea
            :model-value="draft"
            :rows="5"
            :placeholder="t('pipeline.notes.editor.placeholder')"
            class="w-full"
            data-testid="kanban-note-textarea"
            @update:model-value="emit('update:draft', String($event ?? ''))"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="t('pipeline.notes.editor.errorTitle')"
          :description="error"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('common.actions.cancel')"
          data-testid="kanban-note-cancel"
          @click="close"
        />
        <UButton
          color="primary"
          :label="t('common.actions.save')"
          :loading="props.isSaving"
          data-testid="kanban-note-save"
          @click="emit('save')"
        />
      </div>
    </template>
  </UModal>
</template>
