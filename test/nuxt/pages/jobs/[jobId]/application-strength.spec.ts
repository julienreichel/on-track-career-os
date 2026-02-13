import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import ApplicationStrengthPage from '@/pages/jobs/[jobId]/application-strength.vue';
import { createTestI18n } from '../../../../utils/createTestI18n';

const pageStateMock = {
  loading: ref(false),
  pageError: ref<string | null>(null),
  job: ref({
    id: 'job-1',
    title: 'Senior Product Manager',
  }),
  hasJob: computed(() => true),
  hasEvaluation: computed(() => false),
  showInput: ref(true),
  canEvaluate: ref(false),
  inputs: {
    cvSourceMode: ref('pastedText'),
    coverLetterSourceMode: ref('pastedText'),
    hasTailoredCv: ref(false),
    hasTailoredCoverLetter: ref(false),
    tailoredCvText: ref(''),
    tailoredCoverLetterText: ref(''),
    pastedCvText: ref(''),
    pastedCoverLetterText: ref(''),
    extractedCvText: ref(''),
    extractedCoverLetterText: ref(''),
    isExtractingCv: ref(false),
    isExtractingCoverLetter: ref(false),
    validationErrors: ref([]),
    extractionError: ref<string | null>(null),
    handleFileUpload: vi.fn(),
  },
  evaluator: {
    loading: ref(false),
    error: ref<string | null>(null),
    evaluation: ref(null),
  },
  load: vi.fn().mockResolvedValue(undefined),
  evaluate: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn(),
};

vi.mock('@/composables/useApplicationStrengthPage', () => ({
  useApplicationStrengthPage: () => pageStateMock,
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/jobs', component: { template: '<div>Jobs</div>' } },
    { path: '/jobs/:jobId', component: { template: '<div>Job</div>' } },
    { path: '/jobs/:jobId/application-strength', component: ApplicationStrengthPage },
  ],
});

const stubs = {
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: '<header class="u-page-header"><h1>{{ title }}</h1><p>{{ description }}</p></header>',
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  UAlert: { template: '<div class="u-alert"><slot /></div>' },
  UEmpty: { props: ['title'], template: '<div class="u-empty">{{ title }}<slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  ApplicationStrengthInputCard: {
    template: '<section class="input-card"></section>',
  },
  ApplicationStrengthResultsCard: {
    template: '<section class="results-card"></section>',
  },
  ApplicationStrengthImprovementsCard: {
    template: '<section class="improvements-card"></section>',
  },
};

const i18n = createTestI18n();

describe('Application strength page', () => {
  beforeEach(() => {
    pageStateMock.evaluator.evaluation.value = null;
    pageStateMock.showInput.value = true;
    pageStateMock.pageError.value = null;
    pageStateMock.loading.value = false;
    vi.clearAllMocks();
  });

  it('renders with job loaded and input visible before evaluation', async () => {
    router.push('/jobs/job-1/application-strength');
    await router.isReady();

    const wrapper = mount(ApplicationStrengthPage, {
      global: {
        plugins: [router, i18n],
        stubs,
      },
    });

    await Promise.resolve();

    expect(pageStateMock.load).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Senior Product Manager');
    expect(wrapper.find('.input-card').exists()).toBe(true);
    expect(wrapper.find('.results-card').exists()).toBe(false);
  });
});
