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
    maxLength?: number;
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  {
    description: undefined,
    placeholder: undefined,
    rows: 6,
    maxLength: undefined,
    disabled: false,
    readonly: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const count = computed(() => props.modelValue?.length ?? 0);
const countLabel = computed(() => {
  if (props.maxLength) {
    return t('speech.editor.charCount', { count: count.value, max: props.maxLength });
  }
  return t('speech.editor.charCountSimple', { count: count.value });
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
      :maxlength="maxLength"
      :disabled="disabled"
      :readonly="readonly"
      :data-testid="`speech-textarea-${label.toLowerCase().replace(/\s+/g, '-')}`"
      class="mt-4 w-full"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </UCard>
</template>
