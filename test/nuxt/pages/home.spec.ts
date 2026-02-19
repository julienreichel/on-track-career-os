import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import HomePage from '@/pages/home.vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

const mockBadges = {
  earnedBadgeDefinitions: ref([]),
  load: vi.fn(),
};
const mockKanbanStages = ref<KanbanStage[]>([
  { key: 'todo', name: 'ToDo', isSystemDefault: true },
  { key: 'applied', name: 'Applied', isSystemDefault: false },
  { key: 'done', name: 'Done', isSystemDefault: true },
]);
const mockLandingPipeline = {
  isLoading: ref(false),
  counts: ref({ todoCount: 1, activeCount: 2, doneCount: 3 }),
  focusJobs: ref<JobDescription[]>([]),
  load: vi.fn(),
};
const mockProgress = {
  state: ref<{ phase?: string } | null>({ phase: 'bonus' }),
  profile: ref<{ fullName?: string | null } | null>({ fullName: 'Ava Test' }),
  inputs: ref<{ experienceCount: number } | null>(null),
  snapshot: ref(null),
  load: vi.fn(),
};

vi.mock('@/composables/useBadges', () => ({
  useBadges: () => mockBadges,
}));

vi.mock('@/application/kanban-settings/useKanbanSettings', () => ({
  useKanbanSettings: () => ({
    state: {
      stages: mockKanbanStages,
      isLoading: ref(false),
      error: ref<string | null>(null),
    },
    load: vi.fn(),
  }),
}));

vi.mock('@/composables/useLandingPipelineDashboard', () => ({
  useLandingPipelineDashboard: () => mockLandingPipeline,
}));

vi.mock('@/composables/useUserProgress', () => ({
  useUserProgress: () => mockProgress,
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/home', name: 'home', component: HomePage }],
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
  PipelineSummaryBar: {
    template: '<div class="pipeline-summary-bar">{{ counts.todoCount }}-{{ counts.activeCount }}-{{ counts.doneCount }}</div>',
    props: ['counts', 'loading'],
  },
  FocusJobCards: {
    template: '<div class="focus-job-cards">{{ jobs.length }}</div>',
    props: ['jobs', 'stages', 'loading'],
  },
  BadgeGridCard: {
    template: '<div class="badge-grid-card" />',
    props: ['badges'],
  },
};

async function mountPage() {
  await router.push('/home');
  const wrapper = mount(HomePage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });

  await flushPromises();
  return wrapper;
}

describe('Home Page Component', () => {
  beforeEach(() => {
    mockBadges.earnedBadgeDefinitions.value = [];
    mockLandingPipeline.isLoading.value = false;
    mockLandingPipeline.counts.value = { todoCount: 1, activeCount: 2, doneCount: 3 };
    mockLandingPipeline.focusJobs.value = [];
    mockProgress.state.value = { phase: 'bonus' };
    mockProgress.profile.value = { fullName: 'Ava Test' };
    mockProgress.inputs.value = null;
  });

  it('renders header and feature cards without CV upload card', async () => {
    mockProgress.inputs.value = { experienceCount: 0 };
    const wrapper = await mountPage();

    expect(wrapper.find('.u-page-header').text()).toContain(
      i18n.global.t('home.title', { name: 'Ava Test' })
    );
    expect(wrapper.text()).toContain(i18n.global.t('features.profile.title'));
    expect(wrapper.text()).toContain(i18n.global.t('features.jobs.title'));
    expect(wrapper.text()).toContain(i18n.global.t('features.applications.title'));
    expect(wrapper.text()).not.toContain(i18n.global.t('features.cvUpload.title'));
    expect(wrapper.text()).toContain(i18n.global.t('onboarding.actionBox.title'));
  });

  it('shows progress guidance and pipeline dashboard when onboarding is complete', async () => {
    mockProgress.inputs.value = { experienceCount: 1 };
    mockLandingPipeline.focusJobs.value = [{ id: 'job-1' } as JobDescription];
    const wrapper = await mountPage();

    expect(wrapper.find('.progress-guidance-section').exists()).toBe(true);
    expect(wrapper.find('.pipeline-summary-bar').exists()).toBe(true);
    expect(wrapper.find('.focus-job-cards').exists()).toBe(true);
    expect(wrapper.text()).not.toContain(i18n.global.t('onboarding.actionBox.title'));
  });

  it('hides focus today block when there are no focus jobs', async () => {
    mockProgress.inputs.value = { experienceCount: 1 };
    mockLandingPipeline.focusJobs.value = [];
    mockLandingPipeline.isLoading.value = false;

    const wrapper = await mountPage();

    expect(wrapper.find('.pipeline-summary-bar').exists()).toBe(true);
    expect(wrapper.find('.focus-job-cards').exists()).toBe(false);
  });

  it('renders badge grid when badges are earned', async () => {
    mockProgress.inputs.value = { experienceCount: 1 };
    mockBadges.earnedBadgeDefinitions.value = [{ id: 'badge-1' }];
    const wrapper = await mountPage();

    expect(wrapper.find('.badge-grid-card').exists()).toBe(true);
  });
});
