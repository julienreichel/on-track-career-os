<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    description?: string;
    placeholder?: string;
    rows?: number;
    maxWords?: number;
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  {
    description: undefined,
    placeholder: undefined,
    rows: 6,
    maxWords: undefined,
    disabled: false,
    readonly: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const countWords = (value: string | null | undefined) =>
  value ? value.trim().split(/\s+/).filter(Boolean).length : 0;
const wordCount = computed(() => countWords(props.modelValue));
const countLabel = computed(() => {
  if (props.maxWords) {
    return t('applications.speeches.editor.wordCount', {
      count: wordCount.value,
      max: props.maxWords,
    });
  }
  return t('applications.speeches.editor.wordCountSimple', { count: wordCount.value });
});
</script>

<template>
  <UCard>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          {{ label }}
        </h3>
        <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ countLabel }}
      </p>
    </div>

    <UTextarea
      :model-value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :data-testid="`speech-textarea-${label.toLowerCase().replace(/\s+/g, '-')}`"
      class="mt-4 w-full"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </UCard>
</template>
