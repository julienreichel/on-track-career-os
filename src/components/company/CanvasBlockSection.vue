<script setup lang="ts">
import TagInput from '@/components/TagInput.vue';

withDefaults(
  defineProps<{
    modelValue: string[];
    label: string;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    hint: '',
    placeholder: '',
    disabled: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [string[]];
}>();

const handleUpdate = (value: string[]) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <UCard variant="soft" class="w-full">
    <TagInput
      :label="label"
      :hint="hint"
      :placeholder="placeholder"
      :model-value="modelValue"
      :disabled="disabled"
      color="primary"
      @update:model-value="handleUpdate"
    />
  </UCard>
</template>
