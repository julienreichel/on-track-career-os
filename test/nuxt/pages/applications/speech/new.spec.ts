import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../../utils/createTestI18n';
import NewSpeechPage from '@/pages/applications/speech/new.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  }),
}));

vi.mock('@/domain/speech-block/SpeechBlockService', () => ({
  SpeechBlockService: vi.fn().mockImplementation(() => ({
    createDraftSpeechBlock: vi.fn().mockReturnValue({
      userId: 'user-1',
      elevatorPitch: '',
      careerStory: '',
      whyMe: '',
    }),
    createSpeechBlock: vi.fn(),
    listSpeechBlocksByUser: vi.fn(),
    getFullSpeechBlock: vi.fn(),
    updateSpeechBlock: vi.fn(),
    deleteSpeechBlock: vi.fn(),
  })),
}));

// Mock composables that use repositories to avoid Amplify client instantiation
vi.mock('@/application/speech-block/useSpeechBlocks', () => ({
  useSpeechBlocks: () => ({
    items: ref([]),
    loading: ref(false),
    error: ref(null),
    loadAll: vi.fn(),
    createSpeechBlock: vi.fn(),
    deleteSpeechBlock: vi.fn(),
  }),
}));

vi.mock('@/composables/useSpeechEngine', () => ({
  useSpeechEngine: () => ({
    isGenerating: ref(false),
    error: ref(null),
    load: vi.fn(),
    generate: vi.fn(),
  }),
}));

vi.mock('@/application/tailoring/useTailoredMaterials', () => ({
  useTailoredMaterials: () => ({
    items: ref([]),
    loading: ref(false),
    error: ref(null),
  }),
}));

vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));

describe('applications/speech/new page', () => {
  const i18n = createTestI18n();

  it('renders form for creating speech', () => {
    const wrapper = mount(NewSpeechPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div class="page"><slot /></div>' },
          UPageHeader: { template: '<div class="header" />' },
          UPageBody: { template: '<div class="body"><slot /></div>' },
          UCard: { template: '<div class="card"><slot /></div>' },
          UFormField: { template: '<div class="form-field"><slot /></div>' },
          UInput: { template: '<input class="input" />' },
          UTextarea: { template: '<textarea class="textarea" />' },
          UButton: { template: '<button><slot /></button>' },
          UAlert: { template: '<div class="alert" />' },
        },
      },
    });

    expect(wrapper.find('.page').exists()).toBe(true);
    expect(wrapper.find('.input').exists()).toBe(true);
    expect(wrapper.find('.textarea').exists()).toBe(true);
  });
});
