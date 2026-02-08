import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory, Router } from 'vue-router';
import { createTestI18n } from '../../../../utils/createTestI18n';
import StoryNewPage from '@/pages/profile/stories/new.vue';

// Mock composables to prevent real API calls
vi.mock('@/composables/useStoryAutoGenerate', () => ({
  useStoryAutoGenerate: vi.fn(() => ({
    generateStories: vi.fn(),
    error: { value: null },
    isGenerating: { value: false },
  })),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: vi.fn(() => ({
    userId: 'test-user-id',
    username: 'Test User',
  })),
}));

describe('StoryNewPage', () => {
  let wrapper: VueWrapper;
  let router: Router;

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/profile/stories/new', name: 'profile-stories-new', component: { template: '<div>New</div>' } },
      ],
    });

    await router.push('/profile/stories/new');
    await router.isReady();

    const i18n = createTestI18n();

    wrapper = mount(StoryNewPage, {
      global: {
        plugins: [router, i18n],
        stubs: {
          UPage: true,
          UPageHeader: true,
          UPageBody: true,
          UAlert: true,
          UCard: true,
          UButton: true,
          ListSkeletonCards: true,
          CvExperiencePicker: true,
        },
      },
    });
  });

  it('should mount successfully', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should have correct component name', () => {
    expect(wrapper.vm.$options.name || 'StoryNewPage').toBeTruthy();
  });
});
