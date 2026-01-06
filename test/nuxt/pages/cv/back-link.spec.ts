import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvIndexPage from '@/pages/cv/index.vue';

const i18n = createTestI18n();

const itemsRef = ref([]);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoadAll = vi.fn();
const mockDeleteDocument = vi.fn();

vi.mock('@/composables/useCvDocuments', () => ({
  useCvDocuments: () => ({
    items: itemsRef,
    loading: loadingRef,
    error: errorRef,
    loadAll: mockLoadAll,
    deleteDocument: mockDeleteDocument,
  }),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/cv', name: 'cv', component: CvIndexPage },
    { path: '/applications', name: 'applications', component: { template: '<div>Apps</div>' } },
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
          <button v-for="(link, idx) in links" :key="idx" type="button">
            {{ link.label }}
          </button>
        </div>
      </header>
    `,
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UAlert: { template: '<div class="u-alert"></div>' },
  UEmpty: { template: '<div class="u-empty"></div>' },
  UButton: { template: '<button type="button"></button>' },
  UIcon: { template: '<span class="u-icon"></span>' },
  ItemCard: {
    props: ['title'],
    template: '<div class="item-card"><h3>{{ title }}</h3><slot /></div>',
  },
  ConfirmModal: { template: '<div class="confirm-modal"></div>' },
};

async function mountPage() {
  await router.push('/cv');
  await router.isReady();
  return mount(CvIndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
      mocks: {
        useToast: () => ({ add: vi.fn() }),
      },
    },
  });
}

describe('CV list page', () => {
  it('renders back to applications link', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('navigation.backToApplications'));
  });

  it('orders CVs by newest updated date', async () => {
    itemsRef.value = [
      {
        id: 'cv-older',
        name: 'Older CV',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cv-newer',
        name: 'Newer CV',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      },
    ];

    const wrapper = await mountPage();
    const cards = wrapper.findAll('.item-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.text()).toContain('Newer CV');
    expect(cards[1]?.text()).toContain('Older CV');
  });
});
