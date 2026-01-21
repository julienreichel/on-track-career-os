import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../../utils/createTestI18n';
import CvTemplatesIndexPage from '@/pages/templates/cv/index.vue';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { SystemCvTemplate } from '@/domain/cvtemplate/systemTemplates';

const i18n = createTestI18n();

const templatesRef = ref<CVTemplate[]>([]);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const mockLoad = vi.fn();
const mockCreateFromExemplar = vi.fn();
const mockCreateTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();

const systemTemplates: SystemCvTemplate[] = [
  {
    id: 'system:classic',
    name: 'Classic',
    description: 'Classic template',
    source: 'system:classic',
    content: '# Classic',
  },
];

vi.mock('@/application/cvtemplate/useCvTemplates', () => ({
  useCvTemplates: () => ({
    templates: templatesRef,
    systemTemplates,
    loading: loadingRef,
    error: errorRef,
    load: mockLoad,
    createFromExemplar: mockCreateFromExemplar,
    createTemplate: mockCreateTemplate,
    deleteTemplate: mockDeleteTemplate,
  }),
}));

const settingsRef = ref({
  id: 'user-1',
  defaultTemplateId: 'template-2',
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

vi.mock('#app', () => ({
  useToast: () => mockToast,
}));

vi.mock('#imports', () => ({
  useToast: () => mockToast,
}));

const mockToast = {
  add: vi.fn(),
};

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/templates/cv', name: 'templates-cv', component: CvTemplatesIndexPage },
    {
      path: '/templates/cv/:id',
      name: 'templates-cv-id',
      component: { template: '<div>Template editor</div>' },
    },
  ],
});

const stubs = {
  UContainer: { template: '<div class="u-container"><slot /></div>' },
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description', 'links'],
    template: `
      <div class="u-page-header">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <button
          v-for="link in links"
          :key="link.label"
          type="button"
          @click="link.onClick ? link.onClick() : $router.push(link.to)"
        >
          {{ link.label }}
        </button>
      </div>
    `,
  },
  UAlert: { template: '<div class="u-alert"><slot /></div>' },
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  UPageGrid: { template: '<div class="u-page-grid"><slot /></div>' },
  UEmpty: {
    props: ['title', 'description'],
    template:
      '<div class="u-empty"><p>{{ title }}</p><p>{{ description }}</p><slot name="actions" /></div>',
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  CvTemplateCard: {
    props: ['name', 'primaryActionLabel', 'secondaryActionLabel', 'showDelete', 'dataTestid'],
    emits: ['primary', 'secondary', 'delete'],
    template: `
      <div :data-testid="dataTestid">
        <p>{{ name }}</p>
        <button v-if="primaryActionLabel" data-testid="primary" @click="$emit('primary')">
          {{ primaryActionLabel }}
        </button>
        <button v-if="secondaryActionLabel" data-testid="secondary" @click="$emit('secondary')">
          {{ secondaryActionLabel }}
        </button>
        <button v-if="showDelete" data-testid="delete" @click="$emit('delete')">
          delete
        </button>
      </div>
    `,
  },
  ConfirmModal: {
    props: ['open'],
    emits: ['confirm'],
    template:
      '<div v-if="open"><button data-testid="confirm-delete" @click="$emit(\'confirm\')">Confirm</button></div>',
  },
  ListSkeletonCards: { template: '<div class="skeleton"></div>' },
};

describe('CV Templates list page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    templatesRef.value = [
      {
        id: 'template-1',
        name: 'My Template',
        content: '# Template',
        source: 'user',
      } as CVTemplate,
    ];
    loadingRef.value = false;
    errorRef.value = null;
    await router.push('/templates/cv');
    await router.isReady();
  });

  it('loads templates and renders cards', async () => {
    const wrapper = mount(CvTemplatesIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(mockLoad).toHaveBeenCalled();
    expect(wrapper.text()).toContain('My Template');
    expect(wrapper.text()).toContain('Classic');
  });

  it('creates from system template and navigates to editor', async () => {
    mockCreateFromExemplar.mockResolvedValue({
      id: 'template-new',
      name: 'Classic copy',
      content: '# Classic',
      source: 'system:classic',
    });

    const wrapper = mount(CvTemplatesIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    const button = wrapper.find(
      '[data-testid="cv-template-system-system-classic"] [data-testid="primary"]'
    );
    await button.trigger('click');
    await flushPromises();

    expect(mockCreateFromExemplar).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe('templates-cv-id');
  });

  it('deletes a template after confirmation', async () => {
    mockDeleteTemplate.mockImplementation(async (id: string) => {
      templatesRef.value = templatesRef.value.filter((template) => template.id !== id);
    });

    const wrapper = mount(CvTemplatesIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    await wrapper.find('[data-testid="cv-template-template-1"] [data-testid="delete"]').trigger('click');
    await wrapper.find('[data-testid="confirm-delete"]').trigger('click');
    await flushPromises();

    expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1');
  });
});
