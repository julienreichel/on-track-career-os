<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  open: boolean;
  isCreating?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  leave: [];
}>();

const { t } = useI18n();

const handleStay = () => {
  emit('update:open', false);
};

const handleLeave = () => {
  emit('leave');
};
</script>

<template>
  <UModal
    :model-value="open"
    :title="isCreating ? t('storyEditor.cancelCreation') : t('storyEditor.unsavedChanges')"
    :description="
      isCreating
        ? t('storyEditor.cancelCreationDescription')
        : t('storyEditor.unsavedChangesDescription')
    "
    @update:model-value="$emit('update:open', $event)"
  >
    <template #footer>
      <UButton :label="t('common.stay')" variant="ghost" @click="handleStay" />
      <UButton :label="t('common.leave')" color="red" @click="handleLeave" />
    </template>
  </UModal>
</template>
