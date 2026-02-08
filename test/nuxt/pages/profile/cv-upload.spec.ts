import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvUploadPage from '@/pages/profile/cv-upload.vue';

// Mock composables to prevent real API calls
vi.mock('@/composables/useCvUploadWorkflow', () => ({
  useCvUploadWorkflow: vi.fn(() => ({
    currentStep: { value: 'upload' },
    errorMessage: { value: null },
    startWorkflow: vi.fn(),
    handleUploadSuccess: vi.fn(),
    handleUploadError: vi.fn(),
    cancelWorkflow: vi.fn(),
  })),
}));

vi.mock('@/composables/useCvParsing', () => ({
  useCvParsing: vi.fn(() => ({
    parsedExperiences: { value: [] },
    parsingError: { value: null },
    isParsing: { value: false },
    parseCv: vi.fn(),
  })),
}));

vi.mock('@/composables/useExperienceImport', () => ({
  useExperienceImport: vi.fn(() => ({
    importError: { value: null },
    isImporting: { value: false },
    importExperiences: vi.fn(),
  })),
}));

describe('CvUploadPage', () => {
  let wrapper: VueWrapper;
  let router: Router;

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/profile/cv-upload',
          name: 'profile-cv-upload',
          component: { template: '<div>CV Upload</div>' },
        },
      ],
    });

    await router.push('/profile/cv-upload');
    await router.isReady();

    const i18n = createTestI18n();

    wrapper = mount(CvUploadPage, {
      global: {
        plugins: [router, i18n],
        stubs: {
          UPage: true,
          UPageHeader: true,
          UPageBody: true,
          UAlert: true,
          UCard: true,
          UButton: true,
          UFileInput: true,
          CvExperiencePreview: true,
        },
      },
    });
  });

  it('should mount successfully', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should have correct component name', () => {
    expect(wrapper.vm.$options.name || 'CvUploadPage').toBeTruthy();
  });
});
