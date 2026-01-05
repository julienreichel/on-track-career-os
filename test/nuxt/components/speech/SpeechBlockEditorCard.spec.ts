import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import SpeechBlockEditorCard from '@/components/speech/SpeechBlockEditorCard.vue';

const i18n = createTestI18n();

const SpeechSectionStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <button class="speech-section" type="button" @click="$emit('update:modelValue', label)">
      {{ label }}
    </button>
  `,
};

describe('SpeechBlockEditorCard', () => {
  it('renders three section editors', () => {
    const wrapper = mount(SpeechBlockEditorCard, {
      global: {
        plugins: [i18n],
        stubs: {
          SpeechSectionEditor: SpeechSectionStub,
        },
      },
      props: {
        modelValue: {
          elevatorPitch: '',
          careerStory: '',
          whyMe: '',
        },
      },
    });

    const sections = wrapper.findAll('.speech-section');
    expect(sections).toHaveLength(3);
  });

  it('emits updated model when a section updates', async () => {
    const wrapper = mount(SpeechBlockEditorCard, {
      global: {
        plugins: [i18n],
        stubs: {
          SpeechSectionEditor: SpeechSectionStub,
        },
      },
      props: {
        modelValue: {
          elevatorPitch: '',
          careerStory: '',
          whyMe: '',
        },
      },
    });

    const sections = wrapper.findAll('.speech-section');
    await sections[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const payload = wrapper.emitted('update:modelValue')?.[0]?.[0];
    expect(payload).toEqual({
      elevatorPitch: i18n.global.t('speech.editor.sections.elevatorPitch.label'),
      careerStory: '',
      whyMe: '',
    });
  });
});
