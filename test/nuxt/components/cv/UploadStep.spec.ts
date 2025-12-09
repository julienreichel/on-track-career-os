import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import UploadStep from '~/components/cv/UploadStep.vue';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvUpload: {
        fileUploaded: 'File uploaded: {fileName}',
      },
    },
  },
});

// Stub Nuxt UI components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot /></div>',
  },
  UFileUpload: {
    name: 'UFileUpload',
    template: '<input type="file" :accept="accept" @change="handleChange" />',
    props: ['modelValue', 'accept'],
    emits: ['update:modelValue'],
    setup(props: any, { emit }: any) {
      const handleChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        emit('update:modelValue', file);
      };
      return { handleChange };
    },
  },
  UAlert: {
    name: 'UAlert',
    template: '<div class="u-alert">{{ title }}</div>',
    props: ['title', 'color'],
  },
};

describe('UploadStep', () => {
  const createWrapper = (props = {}) => {
    return mount(UploadStep, {
      props,
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders the file upload component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
  });

  it('accepts PDF and TXT files', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input[type="file"]');
    expect(input.attributes('accept')).toBe('.pdf,.txt');
  });

  it('emits fileSelected event when file is selected', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input[type="file"]');

    // Create a mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Mock the file input
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');

    expect(wrapper.emitted('fileSelected')).toBeTruthy();
    expect(wrapper.emitted('fileSelected')?.[0]).toEqual([file]);
  });

  it('displays alert when file is selected', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input[type="file"]');

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.u-alert').exists()).toBe(true);
    expect(wrapper.find('.u-alert').text()).toContain('test.pdf');
  });

  it('does not emit event if no file is selected', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', {
      value: [],
      writable: false,
    });

    await input.trigger('change');

    expect(wrapper.emitted('fileSelected')).toBeFalsy();
  });

  it('handles null file gracefully', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', {
      value: null,
      writable: false,
    });

    await input.trigger('change');

    expect(wrapper.emitted('fileSelected')).toBeFalsy();
  });
});
