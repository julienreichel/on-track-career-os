import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import JobUploadStep from '~/components/job/JobUploadStep.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot /></div>',
  },
  UFileUpload: {
    name: 'UFileUpload',
    props: ['modelValue', 'accept', 'disabled'],
    emits: ['update:modelValue'],
    template: '<input type="file" :accept="accept" @change="handleChange" />',
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
    props: ['title'],
    template: '<div class="u-alert">{{ title }}</div>',
  },
  USkeleton: {
    name: 'USkeleton',
    template: '<div class="u-skeleton"><slot /></div>',
  },
};

describe('JobUploadStep', () => {
  const mountComponent = (props = {}) =>
    mount(JobUploadStep, {
      props: {
        selectedFile: null,
        isProcessing: false,
        statusMessage: null,
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

  it('renders file upload input', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
  });

  it('emits fileSelected event when file chosen', async () => {
    const wrapper = mountComponent();
    const input = wrapper.find('input[type="file"]');
    const file = new File(['content'], 'job.pdf', { type: 'application/pdf' });

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');

    expect(wrapper.emitted('fileSelected')).toBeTruthy();
    expect(wrapper.emitted('fileSelected')?.[0]).toEqual([file]);
  });

  it('displays status skeleton when processing', () => {
    const wrapper = mountComponent({
      isProcessing: true,
      statusMessage: 'jobUpload.status.analyzing',
    });

    expect(wrapper.findAll('.u-skeleton').length).toBeGreaterThan(0);
  });

  it('shows alert with file name when upload completed', () => {
    const file = new File(['content'], 'job.pdf', { type: 'application/pdf' });
    const wrapper = mountComponent({ selectedFile: file, isProcessing: false });

    expect(wrapper.find('.u-alert').exists()).toBe(true);
  });
});
