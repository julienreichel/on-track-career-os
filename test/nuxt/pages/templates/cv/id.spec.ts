import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../../utils/createTestI18n';
import CvTemplateEditorPage from '@/pages/templates/cv/[id].vue';

const i18n = createTestI18n();

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/domain/cvtemplate/CVTemplateService', () => ({
  CVTemplateService: vi.fn().mockImplementation(() => ({
    get: mockGet,
    update: mockUpdate,
    delete: mockDelete,
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

vi.mock('#app', () => ({
  useToast: () => mockToast,
}));

vi.mock('#imports', () => ({
  useToast: () => mockToast,
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/templates/cv/:id',
      name: 'templates-cv-id',
      component: CvTemplateEditorPage,
    },
    {
      path: '/templates/cv',
      name: 'templates-cv',
      component: { template: '<div>Templates list</div>' },
    },
  ],
});

const stubs = {
  UContainer: { template: '<div class="u-container"><slot /></div>' },
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: '<div><h1>{{ title }}</h1><slot /></div>',
  },
  UAlert: { template: '<div class="u-alert"><slot /></div>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UButton: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
  ConfirmModal: {
    props: ['open'],
    emits: ['confirm'],
    template: '<div v-if="open"><button @click="$emit(\'confirm\')">Confirm</button></div>',
  },
  TemplateSourceBadge: { template: '<span class="badge"></span>' },
  CvTemplateEditor: {
    name: 'CvTemplateEditor',
    props: ['name', 'content', 'loading'],
    emits: ['update:name', 'update:content'],
    template: '<div class="cv-template-editor"></div>',
  },
};

describe('CV Template editor page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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
    await router.push('/templates/cv/template-1');
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
      .find((button) => button.text() === i18n.global.t('common.save'));
    expect(initialSaveButton?.attributes('disabled')).toBeDefined();

    const editor = wrapper.findComponent({ name: 'CvTemplateEditor' });
    await editor.vm.$emit('update:name', 'Updated Template');
    await flushPromises();

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('common.save'));
    expect(saveButton?.attributes('disabled')).toBeUndefined();

    await saveButton?.trigger('click');
    await flushPromises();

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 'template-1',
      name: 'Updated Template',
      content: '# Template',
    });
  });
});
