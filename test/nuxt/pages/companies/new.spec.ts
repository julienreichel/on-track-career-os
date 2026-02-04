import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref, computed } from 'vue';
import NewCompanyPage from '@/pages/companies/new.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const mockCreateCompany = vi.fn();
const mockAnalyzeCreate = vi.fn();
const mockHandleUpload = vi.fn();

vi.mock('@/composables/useCompanies', () => ({
  useCompanies: () => ({
    createCompany: mockCreateCompany,
    searchQuery: vi.fn(),
    listCompanies: vi.fn(),
  }),
}));

const uploadState = {
  selectedFile: ref<File | null>(null),
  errorMessage: ref<string | null>(null),
  status: ref<'idle'>('idle'),
  isProcessing: computed(() => false),
  statusMessage: computed(() => null),
  handleFileSelected: mockHandleUpload,
  reset: vi.fn(),
};

vi.mock('@/composables/useCompanyUpload', () => ({
  useCompanyUpload: () => uploadState,
}));

vi.mock('@/domain/company/CompanyService', () => ({
  CompanyService: vi.fn().mockImplementation(() => ({
    createCompany: mockAnalyzeCreate,
  })),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/companies', component: { template: '<div>List</div>' } },
    { path: '/companies/new', component: NewCompanyPage },
  ],
});

const stubs = {
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title'],
    template: '<header class="u-page-header">{{ title }}<slot /></header>',
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UCard: {
    template: '<div class="u-card"><slot /><slot name="footer" /></div>',
  },
  UDivider: { template: '<div class="u-divider"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}<slot /></div>',
  },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: `
      <button class="u-button" type="button" :disabled="disabled" @click="$emit('click')">
        {{ label }}
      </button>
    `,
  },
  CompanyForm: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="company-form-stub">
        <button type="button" class="set-name" @click="$emit('update:modelValue', { ...modelValue, companyName: 'Nova' })">
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
        <button type="button" class="set-notes" @click="$emit('update:modelValue', 'Notes')">
          Set Notes
        </button>
      </div>
    `,
  },
  CompanyUploadStep: {
    emits: ['fileSelected'],
    template: '<div class="company-upload-step"></div>',
  },
};

async function mountPage() {
  await router.push('/companies/new');
  await router.isReady();
  return mount(NewCompanyPage, {
    global: {
      plugins: [createTestI18n(), router],
      stubs,
    },
  });
}

describe('New Company Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form and action buttons', async () => {
    const wrapper = await mountPage();
    expect(wrapper.find('.company-form-stub').exists()).toBe(true);
    const buttons = wrapper.findAll('.u-button');
    expect(buttons).toHaveLength(1);
  });

  it('calls createCompany when saving', async () => {
    const wrapper = await mountPage();
    (wrapper.vm as any).form.companyName = 'Nova';
    await wrapper.vm.$nextTick();
    await flushPromises();
    const saveButton =
      wrapper.findAll('.u-button').find((button) => button.text().includes('Save')) ??
      wrapper.findAll('.u-button')[1];
    await saveButton.trigger('click');
    expect(mockCreateCompany).toHaveBeenCalled();
  });
});
