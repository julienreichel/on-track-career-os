import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../../utils/createTestI18n';
import CvTemplateEditorPage from '@/pages/settings/cv/[id].vue';

const i18n = createTestI18n();

const mockGet = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/domain/cvtemplate/CVTemplateService', () => ({
  CVTemplateService: vi.fn().mockImplementation(() => ({
    get: mockGet,
    update: mockUpdate,
    delete: vi.fn(),
  })),
}));

const settingsRef = ref({
  id: 'user-1',
  defaultTemplateId: 'template-default',
});
const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn();

vi.mock('@/application/cvsettings/useCvSettings', () => ({
  useCvSettings: () => ({
    settings: settingsRef,
    load: mockLoadSettings,
    saveSettings: mockSaveSettings,
  }),
}));

const mockToast = {
  add: vi.fn(),
};

const mockGenerateCv = vi.fn();

vi.mock('#app', () => ({
  useToast: () => mockToast,
}));

vi.mock('#imports', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  }),
}));

vi.mock('@/composables/useCvGenerator', () => ({
  useCvGenerator: () => ({
    generateCv: mockGenerateCv,
  }),
}));

const mockExperienceList = vi.fn();
vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: class {
    list() {
      return mockExperienceList();
    }
  },
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/settings/cv/:id',
      name: 'settings-cv-id',
      component: CvTemplateEditorPage,
    },
    {
      path: '/settings/cv',
      name: 'settings-cv',
      component: { template: '<div>Templates list</div>' },
    },
  ],
});

const stubs = {
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: '<div><h1>{{ title }}</h1><slot /></div>',
  },
  UAlert: { template: '<div class="u-alert"><slot /></div>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UIcon: { template: '<span class="u-icon"></span>', props: ['name'] },
  UButton: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  CvTemplateEditor: {
    name: 'CvTemplateEditor',
    props: ['name', 'content', 'loading', 'previewContent', 'previewLoading', 'previewError'],
    emits: ['update:name', 'update:content', 'preview'],
    template: '<div class="cv-template-editor"></div>',
  },
};

describe('CV Template editor page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockExperienceList.mockResolvedValue([]);
    mockGet.mockResolvedValue({
      id: 'template-1',
      name: 'Classic Template',
      content: '# Template',
      source: 'system:classic',
    });
    mockUpdate.mockResolvedValue({
      id: 'template-1',
      name: 'Updated Template',
      content: '# Template',
      source: 'system:classic',
    });
    await router.push('/settings/cv/template-1');
    await router.isReady();
  });

  it('loads template and saves after edits', async () => {
    const wrapper = mount(CvTemplateEditorPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(mockGet).toHaveBeenCalledWith('template-1');

    const initialSaveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('common.actions.save'));
    expect(initialSaveButton).toBeDefined();

    const editor = wrapper.findComponent({ name: 'CvTemplateEditor' });
    await editor.vm.$emit('update:name', 'Updated Template');
    await flushPromises();

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('common.actions.save'));
    expect(saveButton).toBeDefined();

    await saveButton?.trigger('click');
    await flushPromises();

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 'template-1',
      name: 'Updated Template',
      content: '# Template',
    });
  });

  it('generates preview content when requested', async () => {
    mockExperienceList.mockResolvedValue([
      {
        id: 'exp-1',
        experienceType: 'work',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
    mockGenerateCv.mockResolvedValue('# Preview content');

    const wrapper = mount(CvTemplateEditorPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    const editor = wrapper.findComponent({ name: 'CvTemplateEditor' });
    await editor.vm.$emit('preview');
    await flushPromises();

    expect(mockGenerateCv).toHaveBeenCalledWith(
      'user-1',
      ['exp-1'],
      expect.objectContaining({
        templateMarkdown: '# Template',
      })
    );
    expect(editor.props('previewContent')).toBe('# Preview content');
  });
});
