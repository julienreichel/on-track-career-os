import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CoverLetterDetailPage from '@/pages/applications/cover-letters/[id]/index.vue';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';

// Mock the CoverLetterRepository to avoid Amplify client instantiation
vi.mock('@/domain/cover-letter/CoverLetterRepository', () => ({
  CoverLetterRepository: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock the CoverLetterService
vi.mock('@/domain/cover-letter/CoverLetterService', () => ({
  CoverLetterService: vi.fn().mockImplementation(() => ({
    deleteCoverLetter: vi.fn(),
  })),
}));

const itemRef = ref<CoverLetter | null>(null);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoad = vi.fn();
const mockSave = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/application/cover-letter/useCoverLetter', () => ({
  useCoverLetter: () => ({
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
  isLoading: ref(false),
  error: ref<string | null>(null),
  hasProfile: ref(true),
  load: vi.fn(),
  generate: generateMock,
};

vi.mock('@/composables/useCoverLetterEngine', () => ({
  useCoverLetterEngine: () => engineMock,
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
  regenerateTailoredCoverLetterForJob: vi.fn(),
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

vi.mock('#app', () => ({
  useToast: () => mockToast,
}));

const mockToast = {
  add: vi.fn(),
};

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/applications/cover-letters/:id',
      name: 'applications-cover-letters-id',
      component: CoverLetterDetailPage,
    },
    {
      path: '/applications/cover-letters',
      name: 'applications-cover-letters',
      component: { template: '<div>Cover letter list</div>' },
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
            :data-testid="link['data-testid']"
            :disabled="link.disabled"
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
  UTextarea: {
    props: ['modelValue', 'placeholder', 'rows'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" :rows="rows" />',
  },
  UInput: {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
  },
  UButton: {
    props: ['label', 'variant', 'color', 'size', 'disabled', 'loading'],
    template:
      '<button type="button" :disabled="disabled || loading" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')" :class="[variant, color, size]"><slot />{{ $props.label }}</button>',
  },
  UCard: { template: '<div class="u-card"><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UFormField: {
    props: ['label', 'name'],
    template: '<div class="u-form-field"><label>{{ label }}</label><slot /></div>',
  },
  ConfirmModal: {
    props: ['modelValue'],
    template: '<div class="confirm-modal" v-if="modelValue"></div>',
  },
  UnsavedChangesModal: {
    props: ['modelValue'],
    template: '<div class="unsaved-modal" v-if="modelValue"></div>',
  },
};

async function mountPage() {
  await router.push('/applications/cover-letters/cl-1');
  await router.isReady();
  return mount(CoverLetterDetailPage, {
    global: {
      plugins: [i18n, router],
      stubs,
      mocks: {
        useToast: () => mockToast,
      },
    },
  });
}

describe('Cover letter detail page', () => {
  beforeEach(() => {
    itemRef.value = {
      id: 'cl-1',
      userId: 'user-1',
      name: 'Test Cover Letter',
      content: 'Dear Hiring Manager,\n\nI am writing to apply...',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString(),
    };
    loadingRef.value = false;
    errorRef.value = null;
    engineMock.isGenerating.value = false;
    engineMock.isLoading.value = false;
    engineMock.error.value = null;
    engineMock.hasProfile.value = true;
    mockLoad.mockResolvedValue(undefined);
    mockSave.mockResolvedValue(itemRef.value);
    mockRemove.mockResolvedValue(true);
    generateMock.mockClear();
    generateMock.mockResolvedValue('New generated cover letter content...');
    mockToast.add.mockClear();
    tailoredMaterialsMock.isGenerating.value = false;
    tailoredMaterialsMock.error.value = null;
    matchingSummaryMock.getByContext.mockResolvedValue({ id: 'summary-1' });
  });

  it('loads cover letter and renders view mode content', async () => {
    const wrapper = await mountPage();
    await flushPromises();
    expect(mockLoad).toHaveBeenCalled();
    expect(engineMock.load).toHaveBeenCalled();

    // Should be in view mode by default
    expect(wrapper.find('.prose').exists()).toBe(true);
    expect(wrapper.text()).toContain(itemRef.value?.content);
  });

  it('displays content in view mode and edit mode', async () => {
    const wrapper = await mountPage();
    await flushPromises();

    // First check view mode content
    const proseContent = wrapper.find('.prose');
    expect(proseContent.exists()).toBe(true);
    expect(proseContent.text()).toContain(itemRef.value?.content);

    const setupState = wrapper.vm.$.setupState as {
      isEditing: boolean;
      editTitle: string;
      editContent: string;
    };
    setupState.editTitle = itemRef.value?.name ?? '';
    setupState.editContent = itemRef.value?.content ?? '';
    setupState.isEditing = true;
    await wrapper.vm.$nextTick();
    await flushPromises();

    // Now check textarea appears
    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);
    expect((textarea.element as HTMLTextAreaElement).value).toBe(itemRef.value?.content);

    const titleInput = wrapper.find('input');
    expect(titleInput.exists()).toBe(true);
    expect((titleInput.element as HTMLInputElement).value).toBe(itemRef.value?.name);
  });

  it('shows tailored regeneration banner when jobId exists', async () => {
    itemRef.value = {
      ...(itemRef.value as CoverLetter),
      jobId: 'job-1',
      name: 'Tailored cover letter',
    };

    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('Target job');
    expect(wrapper.text()).toContain('Regenerate tailored cover letter');
  });

  // Note: Generate button has been removed from detail page to match CV pattern
  // Generation happens during creation flow only

  it('saves changes when save button is clicked', async () => {
    const wrapper = await mountPage();
    await flushPromises();

    const setupState = wrapper.vm.$.setupState as {
      isEditing: boolean;
      editTitle: string;
      editContent: string;
    };
    setupState.editTitle = itemRef.value?.name ?? '';
    setupState.editContent = itemRef.value?.content ?? '';
    setupState.isEditing = true;
    await wrapper.vm.$nextTick();
    await flushPromises();

    // Now modify title + content
    const titleInput = wrapper.find('[data-testid="cover-letter-title-input"]');
    expect(titleInput.exists()).toBe(true);
    await titleInput.setValue('Updated cover letter');

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    await textarea.setValue('Updated cover letter content');
    await wrapper.vm.$nextTick();

    // Click save
    const saveButton = wrapper.find('[data-testid="save-cover-letter-button"]');
    await saveButton.trigger('click');

    expect(mockSave).toHaveBeenCalledWith({
      id: 'cl-1',
      name: 'Updated cover letter',
      content: 'Updated cover letter content',
    });
  });

  // Note: Generate button and profile validation have been removed from detail page
  // These validations now happen during the creation flow
});
