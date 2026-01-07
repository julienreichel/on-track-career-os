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
    readOnly?: boolean;
    emptyLabel?: string;
  }>(),
  {
    hint: '',
    placeholder: '',
    disabled: false,
    testId: undefined,
    readOnly: false,
    emptyLabel: '',
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
    <div v-if="readOnly" class="space-y-2">
      <div>
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {{ label }}
        </p>
        <p v-if="hint" class="text-xs text-gray-500">
          {{ hint }}
        </p>
      </div>
      <div v-if="modelValue.length" class="flex flex-wrap gap-2">
        <UBadge v-for="item in modelValue" :key="item" color="primary" variant="soft">
          {{ item }}
        </UBadge>
      </div>
      <p v-else class="text-sm text-gray-500">
        {{ emptyLabel }}
      </p>
    </div>
    <TagInput
      v-else
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
