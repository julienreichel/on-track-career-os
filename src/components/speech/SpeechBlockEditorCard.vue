<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SpeechSectionEditor from '@/components/speech/SpeechSectionEditor.vue';

type SpeechBlockForm = {
  title?: string;
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
      :label="t('applications.speeches.editor.sections.elevatorPitch.label')"
      :description="t('applications.speeches.editor.sections.elevatorPitch.description')"
      :placeholder="t('applications.speeches.editor.sections.elevatorPitch.placeholder')"
      :max-words="120"
      :disabled="disabled"
      :readonly="readonly"
      data-testid="elevator-pitch-section"
      @update:model-value="updateField('elevatorPitch', $event)"
    />

    <SpeechSectionEditor
      :model-value="modelValue.careerStory"
      :label="t('applications.speeches.editor.sections.careerStory.label')"
      :description="t('applications.speeches.editor.sections.careerStory.description')"
      :placeholder="t('applications.speeches.editor.sections.careerStory.placeholder')"
      :max-words="360"
      :disabled="disabled"
      :readonly="readonly"
      data-testid="career-story-section"
      @update:model-value="updateField('careerStory', $event)"
    />

    <SpeechSectionEditor
      :model-value="modelValue.whyMe"
      :label="t('applications.speeches.editor.sections.whyMe.label')"
      :description="t('applications.speeches.editor.sections.whyMe.description')"
      :placeholder="t('applications.speeches.editor.sections.whyMe.placeholder')"
      :max-words="240"
      :disabled="disabled"
      :readonly="readonly"
      data-testid="why-me-section"
      @update:model-value="updateField('whyMe', $event)"
    />
  </div>
</template>
