import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import IndexPage from '@/pages/index.vue';

const mockUserId = ref<string | null>(null);
const mockExperienceList = vi.fn();
const mockBadges = {
  earnedBadgeDefinitions: ref([]),
  load: vi.fn(),
};
const mockActiveJobs = {
  loading: ref(false),
  states: ref([]),
  load: vi.fn(),
};
const mockProgress = {
  state: ref<{ phase?: string } | null>({ phase: 'bonus' }),
  profile: ref<{ fullName?: string | null } | null>({ fullName: 'Ava Test' }),
  load: vi.fn(),
};

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: mockUserId,
  }),
}));

vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn(() => ({
    list: mockExperienceList,
  })),
}));

vi.mock('@/composables/useBadges', () => ({
  useBadges: () => mockBadges,
}));

vi.mock('@/composables/useActiveJobsDashboard', () => ({
  useActiveJobsDashboard: () => mockActiveJobs,
}));

vi.mock('@/composables/useUserProgress', () => ({
  useUserProgress: () => mockProgress,
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'index', component: IndexPage }],
});

const stubs = {
  UPage: {
    template: '<main class="u-page"><slot /></main>',
  },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template:
      '<div class="u-page-header"><h1>{{ title }}</h1><p v-if="description">{{ description }}</p><slot name="actions" /></div>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UPageCard: {
    props: ['to', 'icon', 'title', 'description'],
    template:
      '<div class="u-page-card"><h3>{{ title }}</h3><p v-if="description">{{ description }}</p></div>',
  },
  UPageGrid: {
    template: '<div class="u-page-grid"><slot /></div>',
  },
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  UButton: {
    props: ['label', 'icon', 'to', 'variant', 'color'],
    template: '<button class="u-button">{{ label }}</button>',
  },
  ProgressGuidanceSection: {
    template: '<div class="progress-guidance-section" />',
    props: ['progress'],
  },
  ActiveJobsCard: {
    template: '<div class="active-jobs-card" />',
    props: ['states', 'loading'],
  },
  BadgeGridCard: {
    template: '<div class="badge-grid-card" />',
    props: ['badges'],
  },
};

async function mountPage() {
  const wrapper = mount(IndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });

  await flushPromises();
  return wrapper;
}

describe('Index Page Component', () => {
  beforeEach(() => {
    mockUserId.value = null;
    mockExperienceList.mockReset();
    mockBadges.earnedBadgeDefinitions.value = [];
    mockActiveJobs.loading.value = false;
    mockActiveJobs.states.value = [];
    mockProgress.state.value = { phase: 'bonus' };
    mockProgress.profile.value = { fullName: 'Ava Test' };
  });

  it('renders header and feature cards without CV upload card', async () => {
    mockExperienceList.mockResolvedValue([]);
    const wrapper = await mountPage();

    mockUserId.value = 'user-1';
    await flushPromises();

    expect(wrapper.find('.u-page-header').text()).toContain(
      i18n.global.t('home.title', { name: 'Ava Test' })
    );
    expect(wrapper.text()).toContain(i18n.global.t('features.profile.title'));
    expect(wrapper.text()).toContain(i18n.global.t('features.jobs.title'));
    expect(wrapper.text()).toContain(i18n.global.t('features.applications.title'));
    expect(wrapper.text()).not.toContain(i18n.global.t('features.cvUpload.title'));
    expect(wrapper.text()).toContain(i18n.global.t('onboarding.actionBox.title'));
  });

  it('shows progress guidance and active jobs when onboarding is complete', async () => {
    mockExperienceList.mockResolvedValue([{ id: 'exp-1' }]);
    mockActiveJobs.states.value = [{ jobId: 'job-1' }];
    const wrapper = await mountPage();

    mockUserId.value = 'user-1';
    await flushPromises();

    expect(wrapper.find('.progress-guidance-section').exists()).toBe(true);
    expect(wrapper.find('.active-jobs-card').exists()).toBe(true);
    expect(wrapper.text()).not.toContain(i18n.global.t('onboarding.actionBox.title'));
  });

  it('renders badge grid when badges are earned', async () => {
    mockExperienceList.mockResolvedValue([{ id: 'exp-1' }]);
    mockBadges.earnedBadgeDefinitions.value = [{ id: 'badge-1' }];
    const wrapper = await mountPage();

    mockUserId.value = 'user-1';
    await flushPromises();

    expect(wrapper.find('.badge-grid-card').exists()).toBe(true);
  });
});
