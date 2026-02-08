import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import JobDetailPage from '@/pages/jobs/[jobId]/index.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const mockLoadJobWithRelations = vi.fn();
const mockUpdateJob = vi.fn();

const baseCompany = {
  id: 'company-1',
  companyName: 'Acme Corp',
};

const baseJobInit = {
  id: 'job-1',
  title: 'Lead Engineer',
  seniorityLevel: 'Senior',
  roleSummary: 'Drive complex software projects.',
  responsibilities: ['Lead development'],
  requiredSkills: ['JavaScript'],
  behaviours: [],
  successCriteria: [],
  explicitPains: [],
  atsKeywords: [],
  status: 'analyzed',
  rawText: 'Job text',
  companyId: 'company-1',
  company: baseCompany,
  owner: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

type JobWithCompany = Omit<typeof baseJobInit, 'companyId' | 'company'> & {
  companyId: string | null;
  company: { id: string; companyName: string } | null;
};

const baseJob: JobWithCompany = { ...baseJobInit, companyId: 'company-1', company: baseCompany };

const selectedJob = ref<JobWithCompany>({ ...baseJob });

const jobAnalysisMock = {
  jobs: ref([]),
  selectedJob,
  listJobs: vi.fn(),
  createAnalyzedJobFromRawText: vi.fn(),
  deleteJob: vi.fn(),
  loadJob: vi.fn(),
  loadJobWithRelations: mockLoadJobWithRelations,
  updateJob: mockUpdateJob,
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

vi.mock('@/composables/useGuidance', () => ({
  useGuidance: () => ({
    guidance: ref({}),
    loading: ref(false),
    error: ref(null),
  }),
}));

const authMock = {
  userId: ref('user-1'),
  loadUserId: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => authMock,
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
    template:
      '<div class="u-card"><slot name="header" /><div class="u-card-body"><slot /></div><div class="u-card-footer"><slot name="footer" /></div></div>',
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
  UIcon: {
    template: '<span class="u-icon"></span>',
    props: ['name'],
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
  LinkedCompanyBadge: {
    props: ['company'],
    template: `
      <div class="linked-company-badge" data-testid="job-company-badge">
        {{ company?.companyName || 'Untitled company' }}
      </div>
    `,
  },
  TailoredMaterialsCard: {
    props: [
      'job',
      'matchingSummary',
      'existingMaterials',
      'summaryLoading',
      'summaryError',
      'descriptionKey',
    ],
    template: '<section class="tailored-materials-card"></section>',
  },
  GuidanceBanner: {
    template: '<div class="guidance-banner-stub"></div>',
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

  await flushPromises();
  return wrapper;
}

describe('Job Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectedJob.value = { ...baseJob };
    mockLoadJobWithRelations.mockImplementation(async () => {
      selectedJob.value = { ...baseJob };
      return selectedJob.value;
    });
    companyStoreMock.rawCompanies.value = [
      { id: 'company-1', companyName: 'Acme Corp' },
      { id: 'company-2', companyName: 'Global Freight' },
    ];
    companyStoreMock.listCompanies.mockResolvedValue(companyStoreMock.rawCompanies.value);
  });

  it('renders job details', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('Lead Engineer');
    expect(router.currentRoute.value.meta.breadcrumbLabel).toBe('Lead Engineer');
    expect(wrapper.find('.tailored-materials-card').exists()).toBe(true);
  });

  it('saves scalar fields when clicking save', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      title: 'Director of Engineering',
    });

    const wrapper = await mountPage();
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();

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
      atsKeywords: [],
    });
  });

  it('saves tag input changes', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      responsibilities: ['Define roadmap'],
    });

    const wrapper = await mountPage();
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();

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
      atsKeywords: [],
    });
  });

  it('resets changes when cancel is clicked', async () => {
    const wrapper = await mountPage();
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();

    const titleInput = wrapper.find('[data-testid="job-title-input"]');
    await titleInput.setValue('Changed Title');

    const cancelButton = wrapper.find('[data-testid="job-cancel-button"]');
    await cancelButton.trigger('click');

    expect(wrapper.find('[data-testid="job-title-input"]').exists()).toBe(false);
    expect(mockUpdateJob).not.toHaveBeenCalled();
  });

  it('links a company when selector emits an update', async () => {
    mockUpdateJob.mockResolvedValue({
      ...selectedJob.value,
      companyId: 'company-2',
    });

    selectedJob.value = { ...baseJob, companyId: null, company: null };
    mockLoadJobWithRelations.mockImplementationOnce(async () => {
      selectedJob.value = { ...baseJob, companyId: null, company: null };
      return selectedJob.value;
    });

    const wrapper = await mountPage();
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();
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
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();
    const clearButton = wrapper.find('[data-testid="job-company-clear"]');
    await clearButton.trigger('click');

    expect(mockUpdateJob).toHaveBeenCalledWith('job-1', { companyId: null });
  });

  it('shows company badge immediately after selection even with stale relationship data', async () => {
    // Start with no company
    selectedJob.value = { ...baseJob, companyId: null, company: null };
    mockLoadJobWithRelations.mockImplementationOnce(async () => {
      selectedJob.value = { ...baseJob, companyId: null, company: null };
      return selectedJob.value;
    });

    // Mock update to set companyId but leave company relationship null (simulating stale data)
    mockUpdateJob.mockImplementation(async (id, updates) => {
      selectedJob.value = {
        ...selectedJob.value,
        ...updates,
        company: null, // Relationship data is stale
      };
      return selectedJob.value;
    });

    const wrapper = await mountPage();

    // Verify no badge initially
    expect(wrapper.find('[data-testid="job-company-badge"]').exists()).toBe(false);

    // Enter edit mode and select company
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();

    const linkButton = wrapper.find('.select-company');
    await linkButton.trigger('click');
    await flushPromises();

    // Badge should appear immediately using availableCompanies fallback
    expect(wrapper.find('[data-testid="job-company-badge"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="job-company-badge"]').text()).toContain('Global Freight');
  });

  it('hides company badge immediately after clearing', async () => {
    // Start with linked company
    selectedJob.value = { ...baseJob, companyId: 'company-1', company: baseCompany };
    mockLoadJobWithRelations.mockImplementationOnce(async () => {
      selectedJob.value = { ...baseJob, companyId: 'company-1', company: baseCompany };
      return selectedJob.value;
    });

    // Mock update to clear companyId but leave stale company relationship
    mockUpdateJob.mockImplementation(async (id, updates) => {
      selectedJob.value = {
        ...selectedJob.value,
        ...updates,
        company: baseCompany, // Relationship data is stale
      };
      return selectedJob.value;
    });

    const wrapper = await mountPage();

    // Verify badge exists initially
    expect(wrapper.find('[data-testid="job-company-badge"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="job-company-badge"]').text()).toContain('Acme Corp');

    // Enter edit mode and clear company
    const editButton = wrapper
      .findAll('.u-button')
      .find((button) => button.text().includes(i18n.global.t('common.actions.edit')));
    await editButton?.trigger('click');
    await flushPromises();

    const clearButton = wrapper.find('[data-testid="job-company-clear"]');
    await clearButton.trigger('click');
    await flushPromises();

    // Badge should disappear immediately even with stale relationship data
    expect(wrapper.find('[data-testid="job-company-badge"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="job-company-clear"]').exists()).toBe(false);
  });

  it('uses companyId as source of truth over stale relationship data', async () => {
    // Simulate stale data: companyId points to company-2 but relationship still has company-1
    selectedJob.value = {
      ...baseJob,
      companyId: 'company-2',
      company: baseCompany, // Stale: still points to company-1
    };
    mockLoadJobWithRelations.mockImplementationOnce(async () => {
      selectedJob.value = {
        ...baseJob,
        companyId: 'company-2',
        company: baseCompany,
      };
      return selectedJob.value;
    });

    const wrapper = await mountPage();

    // Should show Global Freight (company-2) not Acme Corp (company-1)
    expect(wrapper.find('[data-testid="job-company-badge"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="job-company-badge"]').text()).toContain('Global Freight');
    expect(wrapper.find('[data-testid="job-company-badge"]').text()).not.toContain('Acme Corp');
  });
});
