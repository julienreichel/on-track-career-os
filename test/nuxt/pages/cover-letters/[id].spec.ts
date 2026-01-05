import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CoverLetterDetailPage from '@/pages/cover-letters/[id].vue';
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
const mockLoadItem = vi.fn();
const mockUpdateContent = vi.fn();

vi.mock('@/application/cover-letter/useCoverLetter', () => ({
  useCoverLetter: () => ({
    item: itemRef,
    loading: loadingRef,
    error: errorRef,
    loadItem: mockLoadItem,
    updateContent: mockUpdateContent,
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

const mockToast = {
  add: vi.fn(),
};

const i18n = createTestI18n();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/cover-letters/:id', name: 'cover-letter-id', component: CoverLetterDetailPage },
    {
      path: '/cover-letters',
      name: 'cover-letters',
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
  UCard: { template: '<div class="u-card"><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  UFormField: {
    props: ['label', 'name'],
    template: '<div class="u-form-field"><label>{{ label }}</label><slot /></div>',
  },
  UTextarea: {
    props: ['modelValue', 'disabled', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')">{{ label }}</button>',
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
  await router.push('/cover-letters/cl-1');
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
    mockLoadItem.mockResolvedValue(undefined);
    mockUpdateContent.mockResolvedValue(itemRef.value);
    generateMock.mockClear();
    generateMock.mockResolvedValue('New generated cover letter content...');
    mockToast.add.mockClear();
  });

  it('loads cover letter and renders editor', async () => {
    const wrapper = await mountPage();
    expect(mockLoadItem).toHaveBeenCalled();
    expect(engineMock.load).toHaveBeenCalled();
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('displays content in textarea', async () => {
    const wrapper = await mountPage();
    const textarea = wrapper.find('textarea');
    expect((textarea.element as HTMLTextAreaElement).value).toBe(itemRef.value?.content);
  });

  it('invokes generate when generate button is clicked', async () => {
    const wrapper = await mountPage();
    const generateButton = wrapper.find('[data-testid="generate-cover-letter-button"]');
    await generateButton.trigger('click');
    expect(generateMock).toHaveBeenCalled();
  });

  it('displays loading state during generation', async () => {
    engineMock.isGenerating.value = true;
    const wrapper = await mountPage();
    const generateButton = wrapper.find('[data-testid="generate-cover-letter-button"]');
    expect(generateButton.attributes('disabled')).toBeDefined();
  });

  it('saves changes when save button is clicked', async () => {
    const wrapper = await mountPage();

    // Modify content
    const textarea = wrapper.find('textarea');
    await textarea.setValue('Updated cover letter content');
    await wrapper.vm.$nextTick();

    // Click save
    const saveButton = wrapper.find('[data-testid="save-cover-letter-button"]');
    await saveButton.trigger('click');

    expect(mockUpdateContent).toHaveBeenCalledWith('Updated cover letter content');
  });

  it('shows info alert when profile is not complete', async () => {
    engineMock.hasProfile.value = false;
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('Profile required');
  });

  it('disables generate button when profile is not complete', async () => {
    engineMock.hasProfile.value = false;
    const wrapper = await mountPage();
    const generateButton = wrapper.find('[data-testid="generate-cover-letter-button"]');
    expect(generateButton.attributes('disabled')).toBeDefined();
  });
});
