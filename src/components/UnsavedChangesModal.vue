<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  discard: [];
}>();

const { t } = useI18n();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const handleGoBack = () => {
  emit('update:open', false);
};

const handleDiscard = () => {
  emit('discard');
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('storyEditor.unsavedChanges')"
    :description="t('storyEditor.unsavedChangesDescription')"
  >
    <template #footer>
      <UButton :label="t('common.goBack')" variant="ghost" @click="handleGoBack" />
      <UButton :label="t('common.discard')" color="red" @click="handleDiscard" />
    </template>
  </UModal>
</template>
