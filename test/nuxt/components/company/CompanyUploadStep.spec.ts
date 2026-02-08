import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CompanyUploadStep from '~/components/company/CompanyUploadStep.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot /></div>',
  },
  UFileUpload: {
    name: 'UFileUpload',
    props: ['modelValue', 'label', 'description', 'accept', 'clearable', 'disabled'],
    template: `
      <div class="file-upload">
        <label>{{ label }}</label>
        <p>{{ description }}</p>
        <input 
          type="file" 
          :accept="accept"
          :disabled="disabled"
          @change="$emit('update:modelValue', $event.target.files?.[0])"
        />
      </div>
    `,
  },
  USkeleton: {
    name: 'USkeleton',
    props: ['class'],
    template: '<div :class="\'skeleton \' + $props.class"></div>',
  },
  UAlert: {
    name: 'UAlert',
    props: ['color', 'title'],
    template: '<div class="alert" :data-color="color">{{ title }}</div>',
  },
};

function mountCompanyUploadStep(props: any = {}) {
  return mount(CompanyUploadStep, {
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
}

describe('CompanyUploadStep', () => {
  describe('File Upload Rendering', () => {
    it('renders file upload component', () => {
      const wrapper = mountCompanyUploadStep();
      expect(wrapper.findComponent({ name: 'UFileUpload' }).exists()).toBe(true);
    });

    it('displays upload label', () => {
      const wrapper = mountCompanyUploadStep();
      expect(wrapper.text()).toContain('Drop company brief or click to browse');
    });

    it('displays upload description', () => {
      const wrapper = mountCompanyUploadStep();
      expect(wrapper.text()).toContain('Supports PDF and TXT files');
    });

    it('accepts PDF and text files', () => {
      const wrapper = mountCompanyUploadStep();
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });
      expect(fileUpload.props('accept')).toBe('.pdf,.txt');
    });

    it('sets clearable to false', () => {
      const wrapper = mountCompanyUploadStep();
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });
      expect(fileUpload.props('clearable')).toBe(false);
    });
  });

  describe('File Selection', () => {
    it('emits fileSelected when file is chosen', async () => {
      const wrapper = mountCompanyUploadStep();
      const file = new File(['content'], 'company.pdf', { type: 'application/pdf' });
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });

      await fileUpload.vm.$emit('update:modelValue', file);

      expect(wrapper.emitted('fileSelected')).toBeTruthy();
      expect(wrapper.emitted('fileSelected')?.[0]).toEqual([file]);
    });

    it('emits undefined when file is null', async () => {
      const wrapper = mountCompanyUploadStep();
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });

      await fileUpload.vm.$emit('update:modelValue', null);

      expect(wrapper.emitted('fileSelected')).toBeTruthy();
      expect(wrapper.emitted('fileSelected')?.[0]).toEqual([undefined]);
    });

    it('emits undefined when file is undefined', async () => {
      const wrapper = mountCompanyUploadStep();
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });

      await fileUpload.vm.$emit('update:modelValue', undefined);

      expect(wrapper.emitted('fileSelected')).toBeTruthy();
      expect(wrapper.emitted('fileSelected')?.[0]).toEqual([undefined]);
    });

    it('passes selected file to file upload component', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({ selectedFile: file });
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });

      expect(fileUpload.props('modelValue')).toStrictEqual(file);
    });
  });

  describe('Processing State', () => {
    it('does not show status by default', () => {
      const wrapper = mountCompanyUploadStep();
      expect(wrapper.findAllComponents({ name: 'USkeleton' })).toHaveLength(0);
    });

    it('shows skeletons when processing', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: 'Processing...',
      });
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays status message when processing', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: 'Extracting company information...',
      });
      expect(wrapper.text()).toContain('Extracting company information...');
    });

    it('does not show status when isProcessing is true but statusMessage is null', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: null,
      });
      expect(wrapper.findAllComponents({ name: 'USkeleton' })).toHaveLength(0);
    });

    it('disables file upload when processing', () => {
      const wrapper = mountCompanyUploadStep({ isProcessing: true });
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });
      expect(fileUpload.props('disabled')).toBe(true);
    });

    it('enables file upload when not processing', () => {
      const wrapper = mountCompanyUploadStep({ isProcessing: false });
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });
      expect(fileUpload.props('disabled')).toBe(false);
    });
  });

  describe('File Uploaded Alert', () => {
    it('shows alert when file is selected and not processing', () => {
      const file = new File(['content'], 'company.pdf', { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: false,
      });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.exists()).toBe(true);
    });

    it('displays file name in alert', () => {
      const file = new File(['content'], 'my-company.pdf', { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: false,
      });
      expect(wrapper.text()).toContain('my-company.pdf');
    });

    it('alert has primary color', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: false,
      });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('color')).toBe('primary');
    });

    it('does not show alert when processing', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: true,
        statusMessage: 'Processing...',
      });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.exists()).toBe(false);
    });

    it('does not show alert when no file selected', () => {
      const wrapper = mountCompanyUploadStep({
        selectedFile: null,
        isProcessing: false,
      });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.exists()).toBe(false);
    });
  });

  describe('Component Structure', () => {
    it('renders within UCard', () => {
      const wrapper = mountCompanyUploadStep();
      expect(wrapper.findComponent({ name: 'UCard' }).exists()).toBe(true);
    });

    it('has proper spacing classes', () => {
      const wrapper = mountCompanyUploadStep();
      expect(wrapper.html()).toContain('space-y-4');
    });
  });

  describe('Skeleton Animation', () => {
    it('renders two skeletons when processing', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: 'Processing...',
      });
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons).toHaveLength(2);
    });

    it('skeletons have correct heights', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: 'Processing...',
      });
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons[0].props('class')).toContain('h-20');
      expect(skeletons[1].props('class')).toContain('h-12');
    });

    it('skeletons have animate-pulse class', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: 'Processing...',
      });
      const skeletons = wrapper.findAllComponents({ name: 'USkeleton' });
      expect(skeletons[0].props('class')).toContain('animate-pulse');
      expect(skeletons[1].props('class')).toContain('animate-pulse');
    });
  });

  describe('Edge Cases', () => {
    it('handles file with special characters in name', () => {
      const file = new File(['content'], 'my company & info (2024).pdf', {
        type: 'application/pdf',
      });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: false,
      });
      expect(wrapper.text()).toContain('my company & info (2024).pdf');
    });

    it('handles very long file names', () => {
      const longName = 'a'.repeat(200) + '.pdf';
      const file = new File(['content'], longName, { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: false,
      });
      expect(wrapper.text()).toContain(longName);
    });

    it('handles empty status message', () => {
      const wrapper = mountCompanyUploadStep({
        isProcessing: true,
        statusMessage: '',
      });
      // Empty string is falsy, should not show status
      expect(wrapper.findAllComponents({ name: 'USkeleton' })).toHaveLength(0);
    });

    it('handles transition from processing to complete', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const wrapper = mountCompanyUploadStep({
        selectedFile: file,
        isProcessing: true,
        statusMessage: 'Processing...',
      });

      expect(wrapper.findAllComponents({ name: 'USkeleton' }).length).toBeGreaterThan(0);

      await wrapper.setProps({
        isProcessing: false,
        statusMessage: null,
      });

      expect(wrapper.findAllComponents({ name: 'USkeleton' })).toHaveLength(0);
      expect(wrapper.findComponent({ name: 'UAlert' }).exists()).toBe(true);
    });
  });

  describe('Props Validation', () => {
    it('accepts PDF file', async () => {
      const wrapper = mountCompanyUploadStep();
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });

      await fileUpload.vm.$emit('update:modelValue', file);

      expect(wrapper.emitted('fileSelected')?.[0]).toEqual([file]);
    });

    it('accepts text file', async () => {
      const wrapper = mountCompanyUploadStep();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const fileUpload = wrapper.findComponent({ name: 'UFileUpload' });

      await fileUpload.vm.$emit('update:modelValue', file);

      expect(wrapper.emitted('fileSelected')?.[0]).toEqual([file]);
    });
  });
});
