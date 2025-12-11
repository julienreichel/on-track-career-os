<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  isCreating?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  leave: [];
}>();

const { t } = useI18n();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const handleStay = () => {
  emit('update:open', false);
};

const handleLeave = () => {
  emit('leave');
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isCreating ? t('storyEditor.cancelCreation') : t('storyEditor.unsavedChanges')"
    :description="
      isCreating
        ? t('storyEditor.cancelCreationDescription')
        : t('storyEditor.unsavedChangesDescription')
    "
  >
    <template #footer>
      <UButton :label="t('common.stay')" variant="ghost" @click="handleStay" />
      <UButton :label="t('common.leave')" color="red" @click="handleLeave" />
    </template>
  </UModal>
</template>
