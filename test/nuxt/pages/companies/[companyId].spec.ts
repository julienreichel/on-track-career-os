import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, reactive } from 'vue';
import CompanyDetailPage from '@/pages/companies/[companyId].vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { Company } from '@/domain/company/Company';

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
const mockSave = vi.fn().mockResolvedValue(companyRef.value);
const mockAnalyze = vi.fn().mockResolvedValue(companyRef.value);

vi.mock('@/application/company/useCompany', () => ({
  useCompany: () => ({
    company: companyRef,
    load: mockLoad,
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
  draftSummary: ref(''),
  dirty: ref(false),
  isEmpty: ref(true),
  loading: ref(false),
  error: ref(null),
  load: vi.fn().mockResolvedValue(null),
  updateBlock: vi.fn(),
  updateSummary: vi.fn(),
  save: vi.fn().mockResolvedValue(null),
  regenerate: vi.fn().mockResolvedValue(null),
};

vi.mock('@/application/company/useCompanyCanvas', () => ({
  useCompanyCanvas: () => canvasMock,
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
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: '<button class="u-button" type="button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
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
  });

  it('loads company details on mount', async () => {
    await mountPage();
    await flushPromises();
    expect(mockLoad).toHaveBeenCalled();
  });

  it('saves company changes', async () => {
    const wrapper = await mountPage();
    await flushPromises();
    (wrapper.vm as any).form.companyName = 'Updated';
    await wrapper.vm.$nextTick();
    await flushPromises();
    const saveButton =
      wrapper
        .findAll('.u-button')
        .find((button) => button.text().includes('Save company')) ??
      wrapper.findAll('.u-button').at(-1);
    expect(saveButton).toBeTruthy();
    await saveButton!.trigger('click');
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
});
