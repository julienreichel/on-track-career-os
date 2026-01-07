import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import JobsPage from '@/pages/jobs/index.vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const jobsRef = ref<JobDescription[]>([]);
const mockListJobs = vi.fn();
const mockDeleteJob = vi.fn();

vi.mock('@/composables/useJobAnalysis', () => ({
  useJobAnalysis: () => ({
    jobs: jobsRef,
    selectedJob: ref(null),
    loading: ref(false),
    error: ref(null),
    listJobs: mockListJobs,
    deleteJob: mockDeleteJob,
    loadJob: vi.fn(),
    createJobFromRawText: vi.fn(),
    updateJob: vi.fn(),
    reanalyseJob: vi.fn(),
    resetState: vi.fn(),
  }),
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/jobs', component: JobsPage },
    { path: '/jobs/new', component: { template: '<div>New Job</div>' } },
    { path: '/companies', component: { template: '<div>Companies</div>' } },
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
        <div class="links" v-if="links">
          <a
            v-for="(link, idx) in links"
            :key="idx"
            :href="link.to"
            class="header-link"
          >
            {{ link.label }}
          </a>
        </div>
      </header>
    `,
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}<slot /></div>',
  },
  UCard: { template: '<div class="u-card"><slot /></div>' },
  ListSkeletonCards: {
    template: '<div class="list-skeleton"><div class="u-skeleton"></div></div>',
  },
  UEmpty: {
    props: ['title', 'description', 'icon'],
    template: '<div class="u-empty">{{ title }}<slot name="actions" /></div>',
  },
  UButton: {
    props: ['label', 'icon', 'to'],
    emits: ['click'],
    template:
      '<button class="u-button" type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <input
        class="u-input"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UPageGrid: { template: '<div class="u-page-grid"><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UModal: {
    props: ['open'],
    emits: ['update:open'],
    template: '<div v-if="open" class="u-modal"><slot name="body" /><slot name="footer" /></div>',
  },
  JobCard: {
    props: ['job', 'showDelete'],
    emits: ['open', 'delete'],
    template: `
      <div class="job-card-stub">
        <h3>{{ job.title }}</h3>
        <button class="open" @click="$emit('open', job.id)">Open</button>
        <button class="delete" @click="$emit('delete', job.id)">Delete</button>
      </div>
    `,
  },
};

async function mountPage() {
  if (router.currentRoute.value.path !== '/jobs') {
    await router.push('/jobs');
  }
  await router.isReady();

  const wrapper = mount(JobsPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe('Jobs List Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobsRef.value = [];
  });

  it('renders page header with navigation links', async () => {
    const wrapper = await mountPage();

    expect(mockListJobs).toHaveBeenCalled();
    const header = wrapper.find('.u-page-header');
    expect(header.text()).toContain(i18n.global.t('features.jobs.title'));
    const addLink = header.find('a[href="/jobs/new"]');
    expect(addLink.exists()).toBe(true);
    const companiesLink = header.find('a[href="/companies"]');
    expect(companiesLink.exists()).toBe(true);
  });

  it('shows empty state when there are no jobs', async () => {
    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.u-empty').exists()).toBe(true);
    expect(wrapper.text()).toContain(i18n.global.t('jobList.empty.title'));
  });

  it('displays search input and job cards when jobs exist', async () => {
    jobsRef.value = [
      {
        id: 'job-1',
        title: 'Head of Engineering',
        seniorityLevel: 'Director',
        roleSummary: 'Lead the engineering organization.',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
        status: 'analyzed',
        rawText: 'text',
        companyId: null,
        owner: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.u-input').exists()).toBe(true);
    expect(wrapper.findAll('.job-card-stub')).toHaveLength(1);
    expect(wrapper.text()).toContain('Head of Engineering');
  });

  it('orders jobs by newest updated date first', async () => {
    jobsRef.value = [
      {
        id: 'job-older',
        title: 'Older Job',
        seniorityLevel: 'Senior',
        roleSummary: 'Older summary.',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
        status: 'analyzed',
        rawText: 'text',
        companyId: null,
        owner: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'job-newer',
        title: 'Newer Job',
        seniorityLevel: 'Lead',
        roleSummary: 'Newer summary.',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
        status: 'analyzed',
        rawText: 'text',
        companyId: null,
        owner: 'user-1',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      },
    ];

    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.job-card-stub');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.text()).toContain('Newer Job');
    expect(cards[1]?.text()).toContain('Older Job');
  });
});
