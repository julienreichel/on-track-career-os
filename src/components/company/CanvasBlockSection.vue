<script setup lang="ts">
import TagInput from '@/components/TagInput.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    label: string;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
    testId?: string;
  }>(),
  {
    hint: '',
    placeholder: '',
    disabled: false,
    testId: undefined,
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
      :placeholder="placeholder"
      :model-value="modelValue"
      :disabled="disabled"
      :test-id="props.testId"
      color="primary"
      @update:model-value="handleUpdate"
    />
  </UCard>
</template>
