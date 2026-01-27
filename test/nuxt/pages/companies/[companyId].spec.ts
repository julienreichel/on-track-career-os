import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, reactive } from 'vue';
import CompanyDetailPage from '@/pages/companies/[companyId].vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { Company } from '@/domain/company/Company';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const companyRef = ref<Company | null>({
  id: 'company-1',
  companyName: 'Atlas Robotics',
  industry: 'Robotics',
  sizeRange: '201-500',
  website: null,
  productsServices: [],
  targetMarkets: [],
  customerSegments: [],
  description: '',
  rawNotes: 'notes',
  owner: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
});

const mockLoad = vi.fn().mockResolvedValue(companyRef.value);
const mockLoadWithRelations = vi.fn();
const mockSave = vi.fn().mockResolvedValue(companyRef.value);
const mockAnalyze = vi.fn().mockResolvedValue(companyRef.value);
const jobsRef = ref<JobDescription[]>([]);
const jobsLoading = ref(false);
const jobsError = ref<string | null>(null);
const mockHydrateJobs = vi.fn((items: JobDescription[]) => {
  jobsRef.value = items;
});

vi.mock('@/application/company/useCompany', () => ({
  useCompany: () => ({
    company: companyRef,
    load: mockLoad,
    loadWithRelations: mockLoadWithRelations,
    save: mockSave,
    analyze: mockAnalyze,
  }),
}));

const canvasMock = {
  canvas: ref({
    needsUpdate: true,
    lastGeneratedAt: '2024-01-02T00:00:00.000Z',
  }),
  draftBlocks: reactive({
    customerSegments: [],
    valuePropositions: [],
    channels: [],
    customerRelationships: [],
    revenueStreams: [],
    keyResources: [],
    keyActivities: [],
    keyPartners: [],
    costStructure: [],
  }),
  dirty: ref(false),
  isEmpty: ref(true),
  loading: ref(false),
  error: ref(null),
  load: vi.fn().mockResolvedValue(null),
  hydrate: vi.fn(),
  updateBlock: vi.fn(),
  save: vi.fn().mockResolvedValue(null),
  regenerate: vi.fn().mockResolvedValue(null),
};

mockLoadWithRelations.mockResolvedValue({
  ...companyRef.value,
  canvas: canvasMock.canvas.value,
  jobs: [],
});

vi.mock('@/application/company/useCompanyCanvas', () => ({
  useCompanyCanvas: () => canvasMock,
}));

vi.mock('@/application/company/useCompanyJobs', () => ({
  useCompanyJobs: () => ({
    jobs: jobsRef,
    loading: jobsLoading,
    error: jobsError,
    hydrate: mockHydrateJobs,
  }),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/companies', component: { template: '<div>Companies</div>' } },
    { path: '/companies/:companyId', component: CompanyDetailPage },
  ],
});

const stubs = {
  UContainer: { template: '<div class="u-container"><slot /></div>' },
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title'],
    template: '<header class="u-page-header">{{ title }}<slot /></header>',
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UCard: {
    template: `
      <div class="u-card">
        <div class="u-card-header"><slot name="header" /></div>
        <div class="u-card-body"><slot /></div>
        <div class="u-card-footer"><slot name="footer" /></div>
      </div>
    `,
  },
  UFormField: {
    props: ['label'],
    template: '<div class="u-form-field"><span class="label">{{ label }}</span><slot /></div>',
  },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template:
      '<button class="u-button" type="button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  CompanyForm: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="company-form-stub">
        <button type="button" class="set-name" @click="$emit('update:modelValue', { ...modelValue, companyName: 'Updated' })">
          Set Name
        </button>
      </div>
    `,
  },
  CompanyNotesInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="company-notes-stub">
        <button class="set-notes" type="button" @click="$emit('update:modelValue', 'Updated notes')">
          Set Notes
        </button>
      </div>
    `,
  },
  CompanyCanvasEditor: {
    props: ['blocks', 'summary'],
    emits: ['update:block', 'update:summary', 'save', 'regenerate'],
    template: `
      <div class="company-canvas-editor">
        <button class="save-canvas" type="button" @click="$emit('save')">Save Canvas</button>
        <button class="regenerate-canvas" type="button" @click="$emit('regenerate')">Regenerate</button>
      </div>
    `,
  },
  JobCard: {
    props: ['job'],
    emits: ['open'],
    template: `
      <div class="job-card-stub">
        <span class="job-title">{{ job.title }}</span>
        <button class="open-job" type="button" @click="$emit('open', job.id)">Open</button>
      </div>
    `,
  },
};

async function mountPage() {
  await router.push('/companies/company-1');
  await router.isReady();
  return mount(CompanyDetailPage, {
    global: {
      plugins: [createTestI18n(), router],
      stubs,
    },
  });
}

describe('Company Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobsRef.value = [];
    jobsLoading.value = false;
    jobsError.value = null;
  });

  it('loads company details on mount', async () => {
    await mountPage();
    await flushPromises();
    expect(mockLoadWithRelations).toHaveBeenCalled();
    expect(canvasMock.hydrate).toHaveBeenCalled();
    expect(mockHydrateJobs).toHaveBeenCalled();
  });

  it('saves company changes', async () => {
    const wrapper = await mountPage();
    await flushPromises();
    await wrapper.find('[data-testid="company-edit-button"]').trigger('click');
    (wrapper.vm as any).form.companyName = 'Updated';
    await wrapper.vm.$nextTick();
    await flushPromises();
    const saveButton = wrapper.find('[data-testid="company-save-button"]');
    expect(saveButton.exists()).toBe(true);
    await saveButton.trigger('click');
    expect(mockSave).toHaveBeenCalled();
  });

  it('handles canvas actions', async () => {
    const wrapper = await mountPage();
    await flushPromises();
    await wrapper.find('.company-canvas-editor .save-canvas').trigger('click');
    await wrapper.find('.company-canvas-editor .regenerate-canvas').trigger('click');
    expect(canvasMock.save).toHaveBeenCalled();
    expect(canvasMock.regenerate).toHaveBeenCalled();
  });

  it('renders linked jobs when available', async () => {
    jobsRef.value = [
      {
        id: 'job-1',
        title: 'Head of Ops',
        seniorityLevel: 'Director',
        status: 'draft',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: 'text',
        companyId: 'company-1',
        responsibilities: [],
        requiredSkills: [],
        behaviours: [],
        successCriteria: [],
        explicitPains: [],
      },
    ];
    mockLoadWithRelations.mockResolvedValueOnce({
      ...companyRef.value,
      canvas: canvasMock.canvas.value,
      jobs: jobsRef.value,
    });
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.findAll('.job-card-stub')).toHaveLength(1);
    expect(wrapper.text()).toContain('Head of Ops');
  });
});
