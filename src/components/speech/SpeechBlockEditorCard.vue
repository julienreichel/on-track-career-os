<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SpeechSectionEditor from '@/components/speech/SpeechSectionEditor.vue';

type SpeechBlockForm = {
  elevatorPitch: string;
  careerStory: string;
  whyMe: string;
};

const props = defineProps<{
  modelValue: SpeechBlockForm;
  disabled?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SpeechBlockForm];
}>();

const { t } = useI18n();

const updateField = (field: keyof SpeechBlockForm, value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<template>
  <div class="space-y-6">
    <SpeechSectionEditor
      :model-value="modelValue.elevatorPitch"
      :label="t('speech.editor.sections.elevatorPitch.label')"
      :description="t('speech.editor.sections.elevatorPitch.description')"
      :placeholder="t('speech.editor.sections.elevatorPitch.placeholder')"
      :max-length="320"
      :disabled="disabled"
      :readonly="readonly"
      @update:model-value="updateField('elevatorPitch', $event)"
    />

    <SpeechSectionEditor
      :model-value="modelValue.careerStory"
      :label="t('speech.editor.sections.careerStory.label')"
      :description="t('speech.editor.sections.careerStory.description')"
      :placeholder="t('speech.editor.sections.careerStory.placeholder')"
      :max-length="800"
      :disabled="disabled"
      :readonly="readonly"
      @update:model-value="updateField('careerStory', $event)"
    />

    <SpeechSectionEditor
      :model-value="modelValue.whyMe"
      :label="t('speech.editor.sections.whyMe.label')"
      :description="t('speech.editor.sections.whyMe.description')"
      :placeholder="t('speech.editor.sections.whyMe.placeholder')"
      :max-length="480"
      :disabled="disabled"
      :readonly="readonly"
      @update:model-value="updateField('whyMe', $event)"
    />
  </div>
</template>
