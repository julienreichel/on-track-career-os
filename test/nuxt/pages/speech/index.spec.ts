import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import SpeechIndexPage from '@/pages/applications/speech/index.vue';

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

const generateMock = vi.fn();
const engineMock = {
  isGenerating: ref(false),
  error: ref<string | null>(null),
  generate: generateMock,
};

vi.mock('@/composables/useSpeechEngine', () => ({
  useSpeechEngine: () => engineMock,
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
    expect(wrapper.text()).toContain(i18n.global.t('navigation.backToApplications'));
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

    const { wrapper } = await mountPage();
    await wrapper.vm.$nextTick();

    await wrapper.find('.u-input').setValue('Targeted');
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAll('.item-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.text()).toContain('Targeted pitch');
  });

  it('creates a speech block with AI content from the list', async () => {
    generateMock.mockResolvedValue({
      elevatorPitch: 'AI pitch',
      careerStory: 'AI story',
      whyMe: 'AI why',
    });
    mockCreateSpeechBlock.mockResolvedValue({
      id: 'speech-1',
      userId: 'user-1',
      elevatorPitch: 'AI pitch',
      careerStory: 'AI story',
      whyMe: 'AI why',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-02-01T00:00:00.000Z',
    });

    const { wrapper } = await mountPage();
    await wrapper.vm.$nextTick();

    const createButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes(i18n.global.t('speech.list.actions.create')));
    expect(createButton).toBeDefined();

    await createButton?.trigger('click');
    await flushPromises();

    expect(generateMock).toHaveBeenCalled();
    expect(mockCreateSpeechBlock).toHaveBeenCalledWith({
      userId: 'user-1',
      elevatorPitch: 'AI pitch',
      careerStory: 'AI story',
      whyMe: 'AI why',
    });
  });
});
