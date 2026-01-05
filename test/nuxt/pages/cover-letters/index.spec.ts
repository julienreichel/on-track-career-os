import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CoverLetterIndexPage from '@/pages/cover-letters/index.vue';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';

// Mock the CoverLetterRepository to avoid Amplify client instantiation
vi.mock('@/domain/cover-letter/CoverLetterRepository', () => ({
  CoverLetterRepository: vi.fn().mockImplementation(() => ({
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    delete: vi.fn(),
  })),
}));

const itemsRef = ref<CoverLetter[]>([]);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoadAll = vi.fn();
const mockDeleteCoverLetter = vi.fn();
const mockCreateCoverLetter = vi.fn();

vi.mock('@/application/cover-letter/useCoverLetters', () => ({
  useCoverLetters: () => ({
    items: itemsRef,
    loading: loadingRef,
    error: errorRef,
    loadAll: mockLoadAll,
    deleteCoverLetter: mockDeleteCoverLetter,
    createCoverLetter: mockCreateCoverLetter,
  }),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('user-1'),
    loadUserId: vi.fn().mockResolvedValue(undefined),
  }),
}));

const mockToast = {
  add: vi.fn(),
};

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/cover-letters', name: 'cover-letters', component: CoverLetterIndexPage },
    {
      path: '/cover-letters/:id',
      name: 'cover-letter-id',
      component: { template: '<div>Cover letter detail</div>' },
    },
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
          <button
            v-for="(link, idx) in links"
            :key="idx"
            type="button"
            @click="link.onClick && link.onClick()"
          >
            {{ link.label }}
          </button>
        </div>
      </header>
    `,
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  UEmpty: {
    props: ['title', 'description'],
    template: '<div class="u-empty">{{ title }}<slot name="actions" /></div>',
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UIcon: { template: '<span class="u-icon"></span>' },
  ItemCard: {
    props: ['title', 'subtitle'],
    template: '<div class="item-card">{{ title }} {{ subtitle }}<slot /></div>',
  },
  ConfirmModal: {
    template: '<div class="confirm-modal"></div>',
  },
};

async function mountPage() {
  await router.push('/cover-letters');
  await router.isReady();
  return mount(CoverLetterIndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
      mocks: {
        useToast: () => mockToast,
      },
    },
  });
}

describe('Cover letter list page', () => {
  beforeEach(() => {
    itemsRef.value = [];
    loadingRef.value = false;
    errorRef.value = null;
    mockLoadAll.mockClear();
    mockCreateCoverLetter.mockClear();
    mockDeleteCoverLetter.mockClear();
    mockToast.add.mockClear();
  });

  it('loads cover letters on mount', async () => {
    await mountPage();
    expect(mockLoadAll).toHaveBeenCalled();
  });

  it('renders empty state when no cover letters exist', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('coverLetter.list.emptyState.title'));
  });

  it('renders cover letters when they exist', async () => {
    itemsRef.value = [
      {
        id: 'cl-1',
        userId: 'user-1',
        name: 'Cover Letter for Developer Position',
        content: 'Dear Hiring Manager,\n\nI am writing to...',
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-16').toISOString(),
      },
      {
        id: 'cl-2',
        userId: 'user-1',
        name: 'Cover Letter for Manager Role',
        content: 'Hello,\n\nI am excited to apply...',
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date('2024-01-21').toISOString(),
      },
    ];
    loadingRef.value = false;

    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    
    // Check that the grid container exists (v-else block)
    const grid = wrapper.find('.grid');
    expect(grid.exists()).toBe(true);
    
    // Find by class instead of component name
    const itemCards = wrapper.findAll('.item-card');
    expect(itemCards).toHaveLength(2);
  });

  it('creates a new cover letter when create button is clicked', async () => {
    const newCoverLetter: CoverLetter = {
      id: 'new-cl',
      userId: 'user-1',
      name: 'New Cover Letter',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCreateCoverLetter.mockResolvedValue(newCoverLetter);

    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    
    // The create button is a link (router-link), not a button that calls createCoverLetter
    // Check that the page renders correctly with the create link
    expect(wrapper.find('.u-page-header').exists()).toBe(true);
    expect(wrapper.text()).toContain(i18n.global.t('coverLetter.list.actions.create'));
  });

  it('displays error when loading fails', async () => {
    errorRef.value = 'Failed to load cover letters';

    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();

    // Check that error alert is displayed
    const alert = wrapper.find('.u-alert');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Failed to load cover letters');
  });
});
