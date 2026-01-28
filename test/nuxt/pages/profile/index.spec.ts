import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import ProfileIndexPage from '@/pages/profile/index.vue';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

const mockUserId = ref<string | null>('user-1');
const mockProfileItem = ref<UserProfile | null>({
  id: 'profile-1',
  fullName: 'Ava Test',
  profilePhotoKey: null,
} as UserProfile);
const mockProfileLoading = ref(false);
const mockProfileError = ref<string | null>(null);
const mockProfileLoad = vi.fn();
const mockExperienceList = vi.fn();
const mockGuidance = ref<{ banner?: { title: string; description?: string } } | null>({
  banner: { title: 'Next step' },
});

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: mockUserId,
  }),
}));

vi.mock('@/application/user-profile/useUserProfile', () => ({
  useUserProfile: () => ({
    item: mockProfileItem,
    loading: mockProfileLoading,
    error: mockProfileError,
    load: mockProfileLoad,
  }),
}));

vi.mock('@/composables/useGuidance', () => ({
  useGuidance: () => ({
    guidance: mockGuidance,
  }),
}));

vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn(() => ({
    list: mockExperienceList,
  })),
}));

const mockProfilePhotoService = {
  getSignedUrl: vi.fn(),
};

vi.mock('@/domain/user-profile/ProfilePhotoService', () => ({
  ProfilePhotoService: vi.fn(() => mockProfilePhotoService),
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/profile', name: 'profile', component: ProfileIndexPage },
    { path: '/profile/full', name: 'profile-full', component: { template: '<div>Full</div>' } },
  ],
});

const stubs = {
  UPage: {
    template: '<main class="u-page"><slot /></main>',
  },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template:
      '<div class="u-page-header"><h1>{{ title }}</h1><p>{{ description }}</p><slot /></div>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UCard: {
    template: '<div class="u-card"><slot /><slot name="header" /></div>',
  },
  UPageGrid: {
    template: '<div class="u-page-grid"><slot /></div>',
  },
  UPageCard: {
    props: ['title', 'description'],
    template: '<div class="u-page-card"><h3>{{ title }}</h3><p>{{ description }}</p></div>',
  },
  UAlert: {
    template: '<div class="u-alert"><slot /></div>',
  },
  USkeleton: {
    template: '<div class="u-skeleton" />',
  },
  GuidanceBanner: {
    props: ['banner'],
    template: '<div class="guidance-banner">{{ banner.title }}</div>',
  },
  ProfileSummaryCard: {
    props: ['profile', 'photoUrl'],
    template: '<div class="profile-summary-card" />',
  },
};

async function mountPage() {
  const wrapper = mount(ProfileIndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe('Profile Index Page', () => {
  beforeEach(() => {
    mockUserId.value = 'user-1';
    mockProfileItem.value = {
      id: 'profile-1',
      fullName: 'Ava Test',
      profilePhotoKey: null,
    } as UserProfile;
    mockProfileLoading.value = false;
    mockProfileError.value = null;
    mockProfileLoad.mockResolvedValue(undefined);
    mockExperienceList.mockResolvedValue([]);
    mockGuidance.value = { banner: { title: 'Next step' } };
    mockProfilePhotoService.getSignedUrl.mockReset();
  });

  it('renders header, summary, and related page cards without CV upload card', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('.u-page-header').text()).toContain(i18n.global.t('profile.title'));
    expect(wrapper.find('.profile-summary-card').exists()).toBe(true);
    expect(wrapper.text()).toContain(i18n.global.t('profile.summary.viewFullProfile'));
    expect(wrapper.text()).toContain(i18n.global.t('profile.links.experiences'));
    expect(wrapper.text()).toContain(i18n.global.t('profile.links.personalCanvas'));
    expect(wrapper.text()).not.toContain(i18n.global.t('profile.links.uploadCv'));
  });

  it('shows guidance banner when guidance is present', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('.guidance-banner').text()).toContain('Next step');
  });
});
