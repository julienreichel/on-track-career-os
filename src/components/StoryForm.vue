<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { StoryFormState } from '@/composables/useStoryEditor';

const props = defineProps<{
  modelValue: StoryFormState;
  disabled?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: StoryFormState];
}>();

const { t } = useI18n();

const updateField = (field: keyof StoryFormState, value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<template>
  <div class="space-y-6">
    <!-- Situation -->
    <UFormField
      :label="t('star.situation.label')"
      :description="t('star.situation.description')"
      required
    >
      <UTextarea
        :model-value="modelValue.situation"
        :placeholder="t('star.situation.placeholder')"
        :rows="4"
        :disabled="disabled"
        :readonly="readonly"
        @update:model-value="updateField('situation', $event)"
      />
    </UFormField>

    <!-- Task -->
    <UFormField :label="t('star.task.label')" :description="t('star.task.description')" required>
      <UTextarea
        :model-value="modelValue.task"
        :placeholder="t('star.task.placeholder')"
        :rows="4"
        :disabled="disabled"
        :readonly="readonly"
        @update:model-value="updateField('task', $event)"
      />
    </UFormField>

    <!-- Action -->
    <UFormField
      :label="t('star.action.label')"
      :description="t('star.action.description')"
      required
    >
      <UTextarea
        :model-value="modelValue.action"
        :placeholder="t('star.action.placeholder')"
        :rows="6"
        :disabled="disabled"
        :readonly="readonly"
        @update:model-value="updateField('action', $event)"
      />
    </UFormField>

    <!-- Result -->
    <UFormField
      :label="t('star.result.label')"
      :description="t('star.result.description')"
      required
    >
      <UTextarea
        :model-value="modelValue.result"
        :placeholder="t('star.result.placeholder')"
        :rows="4"
        :disabled="disabled"
        :readonly="readonly"
        @update:model-value="updateField('result', $event)"
      />
    </UFormField>
  </div>
</template>
