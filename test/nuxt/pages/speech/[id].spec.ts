import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import SpeechDetailPage from '@/pages/applications/speech/[id].vue';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';

// Mock the SpeechBlockRepository to avoid Amplify client instantiation
vi.mock('@/domain/speech-block/SpeechBlockRepository', () => ({
  SpeechBlockRepository: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock the SpeechBlockService
vi.mock('@/domain/speech-block/SpeechBlockService', () => ({
  SpeechBlockService: vi.fn().mockImplementation(() => ({
    generateSpeech: vi.fn(),
  })),
}));

const itemRef = ref<SpeechBlock | null>(null);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoad = vi.fn();
const mockSave = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/application/speech-block/useSpeechBlock', () => ({
  useSpeechBlock: () => ({
    item: itemRef,
    loading: loadingRef,
    error: errorRef,
    load: mockLoad,
    save: mockSave,
    remove: mockRemove,
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

const authMock = {
  userId: ref('user-1'),
  loadUserId: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => authMock,
}));

const tailoredMaterialsMock = {
  isGenerating: ref(false),
  error: ref<string | null>(null),
  contextLoading: ref(false),
  contextError: ref<null | string>(null),
  loadTailoringContext: vi.fn().mockResolvedValue({ ok: false, error: null }),
  regenerateTailoredSpeechForJob: vi.fn(),
};

vi.mock('@/application/tailoring/useTailoredMaterials', () => ({
  useTailoredMaterials: () => tailoredMaterialsMock,
}));

const jobServiceMock = {
  getFullJobDescription: vi.fn().mockResolvedValue({ id: 'job-1', title: 'Lead Engineer' }),
};

vi.mock('@/domain/job-description/JobDescriptionService', () => ({
  JobDescriptionService: vi.fn().mockImplementation(() => jobServiceMock),
}));

const matchingSummaryMock = {
  getByContext: vi.fn().mockResolvedValue({ id: 'summary-1' }),
};

vi.mock('@/domain/matching-summary/MatchingSummaryService', () => ({
  MatchingSummaryService: vi.fn().mockImplementation(() => matchingSummaryMock),
}));

const mockToast = {
  add: vi.fn(),
};

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/applications/speech/:id',
      name: 'applications-speech-id',
      component: SpeechDetailPage,
    },
    {
      path: '/applications/speech',
      name: 'applications-speech',
      component: { template: '<div>Speech list</div>' },
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
        <slot />
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
    emits: ['close'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  UInput: {
    props: ['modelValue', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  UFormField: {
    props: ['label'],
    template: '<label><span>{{ label }}</span><slot /></label>',
  },
  UCard: {
    template:
      '<div class="u-card"><div class="u-card-body"><slot /></div><div class="u-card-footer"><slot name="footer" /></div></div>',
  },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UButton: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  ConfirmModal: { template: '<div class="confirm-modal"></div>' },
  UnsavedChangesModal: { template: '<div class="unsaved-modal"></div>' },
  SpeechBlockEditorCard: {
    props: ['modelValue'],
    template: '<div class="speech-editor"></div>',
  },
};

async function mountPage() {
  await router.push('/applications/speech/speech-1');
  await router.isReady();
  return mount(SpeechDetailPage, {
    global: {
      plugins: [i18n, router],
      stubs,
      mocks: {
        useToast: () => mockToast,
      },
    },
  });
}

describe('Speech detail page', () => {
  beforeEach(() => {
    itemRef.value = {
      id: 'speech-1',
      userId: 'user-1',
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why',
    } as SpeechBlock;
    loadingRef.value = false;
    errorRef.value = null;
    mockLoad.mockResolvedValue(undefined);
    mockSave.mockResolvedValue(itemRef.value);
    mockRemove.mockResolvedValue(true);
    generateMock.mockClear();
    generateMock.mockResolvedValue({
      elevatorPitch: 'New pitch',
      careerStory: 'New story',
      whyMe: 'New why',
    });
    tailoredMaterialsMock.isGenerating.value = false;
    tailoredMaterialsMock.error.value = null;
    matchingSummaryMock.getByContext.mockResolvedValue({ id: 'summary-1' });
  });

  it('loads speech block and renders view mode', async () => {
    const wrapper = await mountPage();
    expect(mockLoad).toHaveBeenCalled();
    expect(wrapper.find('.speech-editor').exists()).toBe(false);

    const editButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes(i18n.global.t('common.edit')));
    expect(editButton).toBeDefined();

    await editButton?.trigger('click');
    await flushPromises();
    expect(wrapper.find('.speech-editor').exists()).toBe(true);
  });

  it('invokes generate when action is triggered', async () => {
    const wrapper = await mountPage();
    await flushPromises();
    const setupState = wrapper.vm.$.setupState as { handleGenerate: () => Promise<void> };
    await setupState.handleGenerate();
    expect(generateMock).toHaveBeenCalled();
  });

  it('shows tailored regeneration banner when jobId exists', async () => {
    itemRef.value = {
      ...(itemRef.value as SpeechBlock),
      jobId: 'job-1',
      name: 'Tailored speech',
    } as SpeechBlock;

    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('Target job');
    expect(wrapper.text()).toContain('Regenerate tailored speech');

    const buttons = wrapper.findAll('button');
    const genericGenerate = buttons.find((button) =>
      [
        i18n.global.t('speech.editor.actions.generate'),
        i18n.global.t('speech.editor.actions.regenerate'),
      ].some((label) => button.text().includes(label))
    );
    expect(genericGenerate).toBeUndefined();
  });

  it('saves the speech title', async () => {
    const wrapper = await mountPage();

    const editButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes(i18n.global.t('common.edit')));
    expect(editButton).toBeDefined();
    await editButton?.trigger('click');
    await flushPromises();

    const titleInput = wrapper.find('[data-testid="speech-title-input"]');
    expect(titleInput.exists()).toBe(true);
    await titleInput.setValue('Updated speech title');

    const saveButton = wrapper.find('[data-testid="save-speech-button"]');
    await saveButton.trigger('click');

    expect(mockSave).toHaveBeenCalledWith({
      id: 'speech-1',
      name: 'Updated speech title',
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why',
    });
  });
});
