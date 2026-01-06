import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import JobDetailPage from '@/pages/jobs/[jobId]/index.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const mockLoadJob = vi.fn();
const mockUpdateJob = vi.fn();
const mockReanalyseJob = vi.fn();

const baseJob = {
  id: 'job-1',
  title: 'Lead Engineer',
  seniorityLevel: 'Senior',
  roleSummary: 'Drive complex software projects.',
  responsibilities: ['Lead development'],
  requiredSkills: ['JavaScript'],
  behaviours: [],
  successCriteria: [],
  explicitPains: [],
  status: 'analyzed',
  rawText: 'Job text',
  companyId: 'company-1',
  owner: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const selectedJob = ref({ ...baseJob });

const jobAnalysisMock = {
  jobs: ref([]),
  selectedJob,
  listJobs: vi.fn(),
  createJobFromRawText: vi.fn(),
  deleteJob: vi.fn(),
  loadJob: mockLoadJob,
  updateJob: mockUpdateJob,
  reanalyseJob: mockReanalyseJob,
  loading: ref(false),
  error: ref(null),
};

vi.mock('@/composables/useJobAnalysis', () => ({
  useJobAnalysis: () => jobAnalysisMock,
}));

const companyStoreMock = {
  companies: ref([]),
  rawCompanies: ref([
    { id: 'company-1', companyName: 'Acme Corp' },
    { id: 'company-2', companyName: 'Global Freight' },
  ]),
  loading: ref(false),
  error: ref(null),
  searchQuery: ref(''),
  listCompanies: vi.fn().mockResolvedValue([]),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  deleteCompany: vi.fn(),
};

vi.mock('@/composables/useCompanies', () => ({
  useCompanies: () => companyStoreMock,
}));

const authMock = {
  userId: ref('user-1'),
  loadUserId: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => authMock,
}));

const matchingSummaryMock = {
  getByContext: vi.fn().mockResolvedValue({ id: 'summary-1' }),
};

vi.mock('@/domain/matching-summary/MatchingSummaryService', () => ({
  MatchingSummaryService: vi.fn().mockImplementation(() => matchingSummaryMock),
}));

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/jobs', component: { template: '<div>Jobs</div>' } },
    { path: '/jobs/:jobId', component: JobDetailPage },
  ],
});

const stubs = {
  UContainer: {
    template: '<div class="u-container"><slot /></div>',
  },
  UPage: {
    template: '<div class="u-page"><slot /></div>',
  },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: `
      <header class="u-page-header">
        <slot />
        <button
          v-for="(link, index) in links"
          :key="index"
          class="header-link"
          type="button"
          @click="link.onClick && link.onClick()"
        >
          {{ link.label }}
        </button>
      </header>
    `,
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UFormField: {
    props: ['label'],
    template: '<label class="u-form-group"><slot /></label>',
  },
  UInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'blur'],
    template: `
      <input
        class="u-input"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      />
    `,
  },
  UTextarea: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'blur'],
    template: `
      <textarea
        class="u-textarea"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      />
    `,
  },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}<slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: `
      <button
        class="u-button"
        type="button"
        :disabled="disabled"
        v-bind="$attrs"
        @click="!disabled && $emit('click')"
      >
        <slot>{{ label }}</slot>
      </button>
    `,
  },
  UTabs: {
    props: ['items'],
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          { class: 'u-tabs' },
          props.items?.map((item: { slot: string }) => slots[item.slot]?.({ item }))
        );
    },
  },
  TagInput: {
    name: 'TagInput',
    props: ['modelValue', 'testId'],
    emits: ['update:modelValue'],
    template: '<div class="tag-input" v-bind="$attrs"></div>',
  },
  UEmpty: {
    template: '<div class="u-empty"><slot /></div>',
  },
  USkeleton: {
    template: '<div class="u-skeleton"></div>',
  },
  UModal: {
    props: ['open'],
    emits: ['update:open'],
    template: `
      <div v-if="open" class="u-modal">
        <slot name="body" />
        <slot name="footer" />
      </div>
    `,
  },
  CompanySelector: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'create', 'clear'],
    template: `
      <div class="company-selector-stub">
        <button
          v-if="!modelValue"
          class="select-company"
          type="button"
          @click="$emit('update:modelValue', 'company-2')"
        >
          Select Company 2
        </button>
        <button
          v-if="!modelValue"
          class="clear-company"
          type="button"
          @click="$emit('update:modelValue', null)"
        >
          Clear
        </button>
      </div>
    `,
  },
  TailoredMaterialsCard: {
    props: ['job', 'matchingSummary', 'summaryLoading', 'summaryError', 'descriptionKey'],
    template: '<section class="tailored-materials-card"></section>',
  },
};

async function mountPage() {
  if (router.currentRoute.value.path !== '/jobs/job-1') {
    await router.push('/jobs/job-1');
  }
  await router.isReady();

  const wrapper = mount(JobDetailPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });

  await Promise.resolve();
  return wrapper;
}

describe('Job Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectedJob.value = { ...baseJob };
    companyStoreMock.rawCompanies.value = [
      { id: 'company-1', companyName: 'Acme Corp' },
      { id: 'company-2', companyName: 'Global Freight' },
    ];
    companyStoreMock.listCompanies.mockResolvedValue(companyStoreMock.rawCompanies.value);
    matchingSummaryMock.getByContext.mockResolvedValue({ id: 'summary-1' });
  });

  it('renders job details', async () => {
    const wrapper = await mountPage();
    const titleInput = wrapper.find('[data-testid="job-title-input"]');
    expect((titleInput.element as HTMLInputElement).value).toBe('Lead Engineer');
    expect(router.currentRoute.value.meta.breadcrumbLabel).toBe('Lead Engineer');
    expect(wrapper.find('.tailored-materials-card').exists()).toBe(true);
  });

  it('saves scalar fields when clicking save', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      title: 'Director of Engineering',
    });

    const wrapper = await mountPage();
    const titleInput = wrapper.find('[data-testid="job-title-input"]');
    await titleInput.setValue('Director of Engineering');
    expect(mockUpdateJob).not.toHaveBeenCalled();

    const saveButton = wrapper.find('[data-testid="job-save-button"]');
    await saveButton.trigger('click');

    expect(mockUpdateJob).toHaveBeenCalledWith('job-1', {
      title: 'Director of Engineering',
      seniorityLevel: 'Senior',
      roleSummary: 'Drive complex software projects.',
      responsibilities: ['Lead development'],
      requiredSkills: ['JavaScript'],
      behaviours: [],
      successCriteria: [],
      explicitPains: [],
    });
  });

  it('saves tag input changes', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      responsibilities: ['Define roadmap'],
    });

    const wrapper = await mountPage();
    const tagInput = wrapper
      .findAllComponents({ name: 'TagInput' })
      .find((component) => component.attributes('data-testid') === 'job-tag-responsibilities');

    expect(tagInput).toBeDefined();
    await tagInput!.vm.$emit('update:modelValue', ['Define roadmap']);
    expect(mockUpdateJob).not.toHaveBeenCalled();

    const saveButton = wrapper.find('[data-testid="job-save-button"]');
    await saveButton.trigger('click');

    expect(mockUpdateJob).toHaveBeenCalledWith('job-1', {
      title: 'Lead Engineer',
      seniorityLevel: 'Senior',
      roleSummary: 'Drive complex software projects.',
      responsibilities: ['Define roadmap'],
      requiredSkills: ['JavaScript'],
      behaviours: [],
      successCriteria: [],
      explicitPains: [],
    });
  });

  it('resets changes when cancel is clicked', async () => {
    const wrapper = await mountPage();
    const titleInput = wrapper.find('[data-testid="job-title-input"]');
    await titleInput.setValue('Changed Title');

    const cancelButton = wrapper.find('[data-testid="job-cancel-button"]');
    await cancelButton.trigger('click');

    expect((titleInput.element as HTMLInputElement).value).toBe('Lead Engineer');
    expect(mockUpdateJob).not.toHaveBeenCalled();
  });

  it('reanalyses job when confirmed', async () => {
    mockReanalyseJob.mockResolvedValue(selectedJob.value);

    const wrapper = await mountPage();
    const reanalyseButton = wrapper.findAll('.header-link')[1];
    await reanalyseButton.trigger('click');

    const confirm = wrapper.find('[data-testid="job-reanalyse-confirm"]');
    await confirm.trigger('click');

    expect(mockReanalyseJob).toHaveBeenCalledWith('job-1');
  });

  it('links a company when selector emits an update', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      companyId: 'company-2',
    });

    selectedJob.value = { ...baseJob, companyId: null };

    const wrapper = await mountPage();
    const linkButton = wrapper.find('.select-company');
    await linkButton.trigger('click');

    expect(mockUpdateJob).toHaveBeenCalledWith('job-1', { companyId: 'company-2' });
  });

  it('clears the company link', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      companyId: null,
    });

    const wrapper = await mountPage();
    const clearButton = wrapper.find('[data-testid="job-company-clear"]');
    await clearButton.trigger('click');

    expect(mockUpdateJob).toHaveBeenCalledWith('job-1', { companyId: null });
  });
});
