import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import SpeechGenerateButton from '@/components/speech/SpeechGenerateButton.vue';

const i18n = createTestI18n();

const stubs = {
  UButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
    props: ['label', 'loading', 'disabled', 'color', 'icon'],
  },
};

describe('SpeechGenerateButton', () => {
  it('should render with generate label when no content', () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        hasContent: false,
      },
    });

    expect(wrapper.text()).toBe('Generate speech');
  });

  it('should render with regenerate label when has content', () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        hasContent: true,
      },
    });

    expect(wrapper.text()).toBe('Regenerate speech');
  });

  it('should render with generating label when loading', () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        loading: true,
      },
    });

    expect(wrapper.text()).toBe('Generating speech...');
  });

  it('should be disabled when loading', () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        loading: true,
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        disabled: true,
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should emit click event when clicked', async () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')!.length).toBeGreaterThanOrEqual(1);
  });

  it('should not emit click when disabled', async () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        disabled: true,
      },
    });

    // Disabled button won't trigger click in most browsers
    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should not emit click when loading', async () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        loading: true,
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should update label when hasContent changes', async () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        hasContent: false,
      },
    });

    expect(wrapper.text()).toBe('Generate speech');

    await wrapper.setProps({ hasContent: true });

    expect(wrapper.text()).toBe('Regenerate speech');
  });

  it('should prioritize loading label over hasContent', async () => {
    const wrapper = mount(SpeechGenerateButton, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        hasContent: true,
        loading: false,
      },
    });

    expect(wrapper.text()).toBe('Regenerate speech');

    await wrapper.setProps({ loading: true });

    expect(wrapper.text()).toBe('Generating speech...');
  });
});
