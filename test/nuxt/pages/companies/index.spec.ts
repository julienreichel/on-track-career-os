import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import CompaniesPage from '@/pages/companies/index.vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { Company } from '@/domain/company/Company';

const companiesRef = ref<Company[]>([]);
const searchRef = ref('');
const mockListCompanies = vi.fn();
const mockDeleteCompany = vi.fn();

vi.mock('@/composables/useCompanies', () => ({
  useCompanies: () => ({
    companies: companiesRef,
    rawCompanies: companiesRef,
    loading: ref(false),
    error: ref(null),
    searchQuery: searchRef,
    listCompanies: mockListCompanies,
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    deleteCompany: mockDeleteCompany,
  }),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/companies', component: CompaniesPage },
    { path: '/companies/new', component: { template: '<div>New Company</div>' } },
    { path: '/jobs', component: { template: '<div>Jobs</div>' } },
  ],
});

const i18n = createTestI18n();

const stubs = {
  UContainer: { template: '<div class="u-container"><slot /></div>' },
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: `
      <header class="u-page-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <a
          v-for="(link, idx) in links"
          :key="idx"
          class="header-link"
          :href="link.to"
        >{{ link.label }}</a>
      </header>
    `,
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}<slot /></div>',
  },
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UEmpty: {
    props: ['title'],
    template: '<div class="u-empty">{{ title }}<slot name="actions" /></div>',
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template:
      '<button class="u-button" type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  UPageGrid: { template: '<div class="u-page-grid"><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UModal: {
    props: ['open'],
    emits: ['update:open'],
    template: '<div v-if="open" class="u-modal"><slot name="body" /><slot name="footer" /></div>',
  },
  CompanyCard: {
    props: ['company'],
    emits: ['open', 'delete'],
    template: `
      <div class="company-card">
        <h3>{{ company.companyName }}</h3>
        <button class="open" @click="$emit('open', company.id)">Open</button>
        <button class="delete" @click="$emit('delete', company.id)">Delete</button>
      </div>
    `,
  },
};

async function mountPage() {
  if (router.currentRoute.value.path !== '/companies') {
    await router.push('/companies');
  }
  await router.isReady();

  return mount(CompaniesPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });
}

describe('Companies List Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    companiesRef.value = [];
    searchRef.value = '';
  });

  it('renders header and triggers load', async () => {
    const wrapper = await mountPage();
    expect(mockListCompanies).toHaveBeenCalled();
    expect(wrapper.find('.u-page-header').text()).toContain(i18n.global.t('companies.list.title'));
    const jobsLink = wrapper.find('a[href="/jobs"]');
    expect(jobsLink.exists()).toBe(true);
  });

  it('shows empty state when no companies exist', async () => {
    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.u-empty').exists()).toBe(true);
  });

  it('renders cards and search when companies exist', async () => {
    companiesRef.value = [
      {
        id: 'company-1',
        companyName: 'Atlas',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      } as Company,
    ];

    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.u-input').exists()).toBe(true);
    expect(wrapper.findAll('.company-card')).toHaveLength(1);
  });
});
