import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import SpeechIndexPage from '@/pages/applications/speech/index.vue';
import type { GuidanceModel } from '@/domain/onboarding';

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

const guidanceRef = ref<GuidanceModel>({
  emptyState: {
    titleKey: 'guidance.applications.speech.empty.title',
    descriptionKey: 'guidance.applications.speech.empty.description',
    cta: { labelKey: 'guidance.applications.speech.empty.cta', to: '/applications/speech/new' },
  },
});

// Mock useGuidance to avoid JobDescriptionRepository instantiation
vi.mock('@/composables/useGuidance', () => ({
  useGuidance: () => ({
    guidance: guidanceRef,
  }),
}));

vi.mock('@/composables/useJobAnalysis', () => ({
  useJobAnalysis: () => ({
    jobs: ref([]),
  }),
}));

const generateMock = vi.fn();
const engineMock = {
  isGenerating: ref(false),
  error: ref<string | null>(null),
  generate: generateMock,
};

vi.mock('@/composables/useSpeechEngine', () => ({
  useSpeechEngine: () => engineMock,
}));

vi.mock('@/application/tailoring/useTailoredMaterials', () => ({
  useTailoredMaterials: () => ({
    isGenerating: ref(false),
    error: ref<string | null>(null),
    contextLoading: ref(false),
    contextError: ref(null),
    materialsLoading: ref(false),
    materialsError: ref(null),
    loadTailoringContext: vi.fn().mockResolvedValue({ ok: false, error: null }),
    loadExistingMaterialsForJob: vi.fn().mockResolvedValue({ ok: false, error: null }),
    generateTailoredSpeechForJob: vi.fn().mockResolvedValue(null),
    regenerateTailoredSpeechForJob: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('#app', () => ({
  useToast: () => mockToast,
}));

vi.mock('#imports', () => ({
  useToast: () => mockToast,
}));

const mockToast = {
  add: vi.fn(),
};

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/applications/speech', name: 'applications-speech', component: SpeechIndexPage },
    {
      path: '/applications/speech/new',
      name: 'applications-speech-new',
      component: { template: '<div>Speech new</div>' },
    },
    {
      path: '/applications/speech/:id',
      name: 'applications-speech-id',
      component: { template: '<div>Speech detail</div>' },
    },
  ],
});

const stubs = {
  UContainer: { template: '<div class="u-container"><slot /></div>' },
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    methods: {
      handleLink(link: { onClick?: () => void; to?: unknown }) {
        if (link.onClick) {
          link.onClick();
          return;
        }
        if (link.to) {
          this.$router.push(link.to);
        }
      },
    },
    template: `
      <header class="u-page-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <div class="links" v-if="links">
          <button
            v-for="(link, idx) in links"
            :key="idx"
            type="button"
            @click="handleLink(link)"
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
  ListSkeletonCards: {
    template: '<div class="list-skeleton"><div class="u-skeleton"></div></div>',
  },
  EmptyStateActionCard: {
    template: '<div class="guidance-empty-state-stub"></div>',
    props: ['emptyState', 'onAction'],
  },
  UEmpty: {
    props: ['title', 'description'],
    template: '<div class="u-empty">{{ title }}<slot name="actions" /></div>',
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
  GuidanceBanner: {
    props: ['banner'],
    template: '<div class="guidance-banner-stub"></div>',
  },
};

async function mountPage() {
  await router.push('/applications/speech');
  await router.isReady();
  const wrapper = mount(SpeechIndexPage, {
    global: {
      plugins: [i18n, router],
      stubs,
      mocks: {
        useToast: () => mockToast,
      },
    },
  });
  await flushPromises();
  return { wrapper, router };
}

describe('Speech list page', () => {
  beforeEach(() => {
    itemsRef.value = [];
    loadingRef.value = false;
    errorRef.value = null;
    guidanceRef.value = {
      emptyState: {
        titleKey: 'guidance.applications.speech.empty.title',
        descriptionKey: 'guidance.applications.speech.empty.description',
        cta: { labelKey: 'guidance.applications.speech.empty.cta', to: '/applications/speech/new' },
      },
    };
    mockLoadAll.mockClear();
    mockCreateSpeechBlock.mockClear();
    generateMock.mockClear();
  });

  it('loads speech blocks on mount', async () => {
    await mountPage();
    expect(mockLoadAll).toHaveBeenCalled();
  });

  it('renders empty state when no speech blocks exist', async () => {
    const { wrapper } = await mountPage();
    expect(wrapper.find('.guidance-empty-state-stub').exists()).toBe(true);
  });

  it('renders back to applications link', async () => {
    const { wrapper } = await mountPage();
    expect(wrapper.text()).toContain(i18n.global.t('common.backToList'));
  });

  it('orders speech blocks by newest updated date', async () => {
    itemsRef.value = [
      {
        id: 'speech-older',
        userId: 'user-1',
        name: 'Older pitch',
        elevatorPitch: '',
        careerStory: '',
        whyMe: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'speech-newer',
        userId: 'user-1',
        name: 'Newer pitch',
        elevatorPitch: '',
        careerStory: '',
        whyMe: '',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      },
    ] as SpeechBlock[];
    guidanceRef.value = {};

    const { wrapper } = await mountPage();
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.item-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.text()).toContain('Newer pitch');
    expect(cards[1]?.text()).toContain('Older pitch');
  });

  it('filters speech blocks by search query', async () => {
    itemsRef.value = [
      {
        id: 'speech-match',
        userId: 'user-1',
        name: 'Targeted pitch',
        elevatorPitch: '',
        careerStory: '',
        whyMe: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'speech-other',
        userId: 'user-1',
        name: 'Other pitch',
        elevatorPitch: '',
        careerStory: '',
        whyMe: '',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ] as SpeechBlock[];
    guidanceRef.value = {};

    const { wrapper } = await mountPage();
    await wrapper.vm.$nextTick();

    await wrapper.find('.u-input').setValue('Targeted');
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.item-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.text()).toContain('Targeted pitch');
  });

  it('navigates to the speech creation page from the list', async () => {
    const { wrapper, router } = await mountPage();
    await wrapper.vm.$nextTick();

    const createButton = wrapper
      .findAll('button')
      .find((button) =>
        button.text().includes(i18n.global.t('applications.speeches.list.actions.create'))
      );
    expect(createButton).toBeDefined();

    await createButton?.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('applications-speech-new');
  });
});
