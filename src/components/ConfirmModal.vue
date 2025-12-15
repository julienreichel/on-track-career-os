<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: 'primary' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'neutral';
    loading?: boolean;
  }>(),
  {
    description: undefined,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmColor: 'red',
    loading: false,
  }
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const handleCancel = () => {
  emit('cancel');
  emit('update:open', false);
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
    close
  >
    <template #footer>
      <UButton :label="cancelLabel" variant="ghost" color="neutral" @click="handleCancel" />
      <UButton :label="confirmLabel" :color="confirmColor" :loading="loading" @click="handleConfirm" />
    </template>
  </UModal>
</template>
