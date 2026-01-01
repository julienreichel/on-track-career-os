import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import MatchPage from '@/pages/jobs/[jobId]/match.vue';
import { createTestI18n } from '../../../../utils/createTestI18n';

const baseJob = {
  id: 'job-1',
  title: 'Lead Engineer',
  status: 'analyzed',
  roleSummary: 'Drive the technical roadmap.',
  companyId: 'company-1',
  updatedAt: '2025-01-01T12:00:00.000Z',
};

const baseSummary = {
  summaryParagraph: 'You can accelerate delivery.',
  impactAreas: ['Ship faster'],
  contributionMap: ['Mentor teams'],
  riskMitigationPoints: ['Ramp up domain knowledge'],
  userFitScore: 82,
};

const engineMock = {
  job: ref({ ...baseJob }),
  matchingSummary: ref({ ...baseSummary }),
  isLoading: ref(false),
  isGenerating: ref(false),
  error: ref<string | null>(null),
  hasSummary: ref(true),
  load: vi.fn(),
  regenerate: vi.fn(),
};

vi.mock('@/composables/useMatchingEngine', () => ({
  useMatchingEngine: vi.fn(() => engineMock),
}));

const companyStoreMock = {
  companies: ref([]),
  rawCompanies: ref([{ id: 'company-1', companyName: 'Acme Systems' }]),
  loading: ref(false),
  error: ref(null),
  searchQuery: ref(''),
  listCompanies: vi.fn().mockResolvedValue([]),
};

vi.mock('@/composables/useCompanies', () => ({
  useCompanies: () => companyStoreMock,
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/jobs', component: { template: '<div>Jobs</div>' } },
    { path: '/jobs/:jobId/match', component: MatchPage },
    { path: '/jobs/:jobId', component: { template: '<div>Job detail</div>' } },
  ],
});

const stubs = {
  UContainer: { template: '<div class="u-container"><slot /></div>' },
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: `
      <header class="u-page-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <slot />
        <slot name="actions" />
      </header>
    `,
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    emits: ['close'],
    template: `
      <div class="u-alert">
        <slot />
        <p class="title">{{ title }}</p>
        <p class="description">{{ description }}</p>
      </div>
    `,
  },
  UButton: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template: `
      <button class="u-button" type="button" :disabled="disabled" @click="$emit('click')">
        {{ label }}
      </button>
    `,
  },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UEmpty: {
    props: ['title'],
    template: '<div class="u-empty">{{ title }}<slot /></div>',
  },
  UProgress: { props: ['modelValue'], template: '<div class="u-progress">{{ modelValue }}</div>' },
  LinkedCompanyBadge: {
    props: ['company'],
    template: '<span class="linked-company">{{ company?.companyName }}</span>',
  },
  MatchingSummaryCard: {
    props: ['summaryParagraph'],
    template: '<div class="matching-card">{{ summaryParagraph }}</div>',
  },
  FitScoreVisualization: {
    props: ['score'],
    template: '<div class="fit-score">{{ score }}</div>',
  },
};

const i18n = createTestI18n();

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mountPage() {
  router.push('/jobs/job-1/match');
  await router.isReady();
  const wrapper = mount(MatchPage, {
    global: {
      plugins: [router, i18n],
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe('Job match page', () => {
  beforeEach(() => {
    engineMock.job.value = { ...baseJob };
    engineMock.matchingSummary.value = { ...baseSummary };
    engineMock.isLoading.value = false;
    engineMock.isGenerating.value = false;
    engineMock.error.value = null;
    engineMock.hasSummary.value = true;
    engineMock.load.mockResolvedValue(undefined);
    engineMock.regenerate.mockResolvedValue(undefined);
    companyStoreMock.listCompanies.mockClear();
  });

  it('loads data on mount and renders summary information', async () => {
    const wrapper = await mountPage();

    expect(engineMock.load).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Lead Engineer');
    expect(wrapper.text()).toContain(baseSummary.summaryParagraph);
    expect(wrapper.find('.fit-score').text()).toContain('82');
  });

  it('shows an empty state when no summary exists', async () => {
    engineMock.hasSummary.value = false;
    engineMock.matchingSummary.value = null;
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('No matching summary yet');
  });

  it('displays errors from the matching engine', async () => {
    engineMock.error.value = 'Something went wrong';
    const wrapper = await mountPage();

    expect(wrapper.find('.u-alert .description').text()).toContain('Something went wrong');
  });

  it('triggers regeneration when the action button is clicked', async () => {
    const wrapper = await mountPage();

    await wrapper.get('[data-testid="matching-generate-button"]').trigger('click');
    expect(engineMock.regenerate).toHaveBeenCalled();
  });
});
