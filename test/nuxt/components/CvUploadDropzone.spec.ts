import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CvUploadDropzone from '~/components/CvUploadDropzone.vue';

// Create i18n instance for tests
// Note: Using manual i18n setup as this component doesn't rely on Nuxt runtime features
// For components that need Nuxt context, use mountSuspended from @nuxt/test-utils/runtime
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvUpload: {
        title: 'Upload Your CV',
        description: 'Upload your CV to extract your professional experience automatically.',
        dropzoneText: 'Drop your CV here or click to browse',
        dropzoneHint: 'Supports PDF and TXT files (max 5MB)',
        fileUploaded: 'File uploaded: {fileName}',
        errors: {
          invalidFileType: 'Invalid file type. Please upload a PDF or TXT file.',
          fileTooLarge: 'File is too large. Maximum size is 5MB.',
          noTextExtracted: 'No text could be extracted from the file.',
          fileReadError: 'Error reading file. Please try again.',
          unknown: 'An unknown error occurred',
        },
      },
    },
  },
});

// Stub Nuxt UI components for unit testing
// This follows the pattern from Nuxt docs: "Using @vue/test-utils" section
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UDropzone: {
    name: 'UDropzone',
    template: '<div class="u-dropzone" data-testid="dropzone"><slot /></div>',
    props: ['accept', 'maxFiles', 'loading'],
  },
  UIcon: {
    name: 'UIcon',
    template: '<span class="u-icon" />',
    props: ['name'],
  },
};

describe('CvUploadDropzone', () => {
  const createWrapper = () => {
    return mount(CvUploadDropzone, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders correctly', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dropzone"]').exists()).toBe(true);
  });

  it('displays title and description', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Upload Your CV');
    expect(wrapper.text()).toContain(
      'Upload your CV to extract your professional experience automatically.'
    );
  });

  it('displays dropzone text and hint', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Drop your CV here or click to browse');
    expect(wrapper.text()).toContain('Supports PDF and TXT files (max 5MB)');
  });

  it('renders UDropzone component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="dropzone"]').exists()).toBe(true);
  });

  it('component structure is correct', () => {
    const wrapper = createWrapper();

    // Check that component has the expected structure
    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dropzone"]').exists()).toBe(true);
  });
});
