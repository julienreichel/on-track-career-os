import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import SpeechIndexPage from '@/pages/speech/index.vue';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

// Mock the SpeechBlockRepository to avoid Amplify client instantiation
vi.mock('@/domain/speech-block/SpeechBlockRepository', () => ({
  SpeechBlockRepository: vi.fn().mockImplementation(() => ({
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    delete: vi.fn(),
  })),
}));

const itemsRef = ref<SpeechBlock[]>([]);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoadAll = vi.fn();
const mockDeleteSpeechBlock = vi.fn();
const mockCreateSpeechBlock = vi.fn();

vi.mock('@/application/speech-block/useSpeechBlocks', () => ({
  useSpeechBlocks: () => ({
    items: itemsRef,
    loading: loadingRef,
    error: errorRef,
    loadAll: mockLoadAll,
    deleteSpeechBlock: mockDeleteSpeechBlock,
    createSpeechBlock: mockCreateSpeechBlock,
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
    { path: '/speech', name: 'speech', component: SpeechIndexPage },
    { path: '/speech/:id', name: 'speech-id', component: { template: '<div>Speech detail</div>' } },
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
  await router.push('/speech');
  await router.isReady();
  return mount(SpeechIndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
      mocks: {
        useToast: () => mockToast,
      },
    },
  });
}

describe('Speech list page', () => {
  beforeEach(() => {
    itemsRef.value = [];
    loadingRef.value = false;
    errorRef.value = null;
    mockLoadAll.mockClear();
  });

  it('loads speech blocks on mount', async () => {
    await mountPage();
    expect(mockLoadAll).toHaveBeenCalled();
  });

  it('renders empty state when no speech blocks exist', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('speech.list.emptyState.title'));
  });

  it('renders back to applications link', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('navigation.backToApplications'));
  });
});
