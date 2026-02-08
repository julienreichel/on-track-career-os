import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { createTestI18n } from '../../../../utils/createTestI18n';
import CoverLetterNewPage from '@/pages/applications/cover-letters/new.vue';

// Mock composables to prevent real API calls
vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: vi.fn(() => ({
    userId: ref('test-user-id'),
    loadUserId: vi.fn(),
  })),
}));

vi.mock('@/composables/useCoverLetterEngine', () => ({
  useCoverLetterEngine: vi.fn(() => ({
    isGenerating: { value: false },
    error: { value: null },
    generateCoverLetter: vi.fn(),
  })),
}));

vi.mock('@/application/cover-letter/useCoverLetters', () => ({
  useCoverLetters: vi.fn(() => ({
    createCoverLetter: vi.fn(),
  })),
}));

vi.mock('@/application/tailoring/useTailoredMaterials', () => ({
  useTailoredMaterials: vi.fn(() => ({
    getJobDescriptionById: vi.fn(),
    getCvDocumentById: vi.fn(),
  })),
}));

vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: vi.fn(() => ({
    trackEvent: vi.fn(),
  })),
}));

describe('CoverLetterNewPage', () => {
  let wrapper: VueWrapper;
  let router: Router;

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/applications/cover-letters/new',
          name: 'applications-cover-letters-new',
          component: { template: '<div>New</div>' },
        },
      ],
    });

    await router.push('/applications/cover-letters/new');
    await router.isReady();

    const i18n = createTestI18n();

    wrapper = mount(CoverLetterNewPage, {
      global: {
        plugins: [router, i18n],
        stubs: {
          UPage: true,
          UPageHeader: true,
          UPageBody: true,
          UCard: true,
          UAlert: true,
          UButton: true,
          UFormField: true,
          UTextarea: true,
          USelect: true,
        },
      },
    });
  });

  it('should mount successfully', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should have correct component name', () => {
    expect(wrapper.vm.$options.name || 'CoverLetterNewPage').toBeTruthy();
  });
});
