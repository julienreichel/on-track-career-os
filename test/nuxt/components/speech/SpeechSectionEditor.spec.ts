import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import SpeechSectionEditor from '@/components/speech/SpeechSectionEditor.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UTextarea: {
    props: ['modelValue', 'placeholder', 'rows', 'disabled', 'readonly', 'maxlength'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
};

describe('SpeechSectionEditor', () => {
  it('renders label, description, and word count', () => {
    const wrapper = mount(SpeechSectionEditor, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: 'Hello',
        label: 'Elevator pitch',
        description: 'Short summary',
        maxWords: 100,
      },
    });

    expect(wrapper.text()).toContain('Elevator pitch');
    expect(wrapper.text()).toContain('Short summary');
    expect(wrapper.text()).toContain(
      i18n.global.t('applications.speeches.editor.wordCount', { count: 1, max: 100 })
    );
  });

  it('emits updates when textarea changes', async () => {
    const wrapper = mount(SpeechSectionEditor, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        modelValue: '',
        label: 'Career story',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('New story');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New story']);
  });
});
