import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvNewPage from '@/pages/applications/cv/new.vue';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';

const i18n = createTestI18n();

const settingsRef = ref({
  id: 'settings-1',
  userId: 'user-1',
  defaultTemplateId: 'template-1',
  defaultDisabledSections: ['languages'],
  defaultExcludedExperienceIds: [],
  showProfilePhoto: true,
});

const mockLoadSettings = vi.fn();

vi.mock('@/application/cvsettings/useCvSettings', () => ({
  useCvSettings: () => ({
    settings: settingsRef,
    loading: ref(false),
    error: ref(null),
    load: mockLoadSettings,
    saveSettings: vi.fn(),
  }),
}));

const templatesRef = ref<CVTemplate[]>([
  {
    id: 'template-1',
    name: 'Classic',
    content: '# Template',
    source: 'user',
  } as CVTemplate,
]);

const mockLoadTemplates = vi.fn();

vi.mock('@/application/cvtemplate/useCvTemplates', () => ({
  useCvTemplates: () => ({
    templates: templatesRef,
    systemTemplates: ref([]),
    loading: ref(false),
    error: ref(null),
    load: mockLoadTemplates,
    createFromExemplar: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('user-1'),
    loadUserId: vi.fn(),
  }),
}));

const mockGenerateCv = vi.fn().mockResolvedValue('# CV');

vi.mock('@/composables/useCvGenerator', () => ({
  useCvGenerator: () => ({
    generateCv: mockGenerateCv,
    generating: ref(false),
    error: ref(null),
  }),
}));

const mockCreateDocument = vi.fn().mockResolvedValue({ id: 'cv-1' });

vi.mock('@/composables/useCvDocuments', () => ({
  useCvDocuments: () => ({
    createDocument: mockCreateDocument,
  }),
}));

vi.mock('@/application/tailoring/useTailoredMaterials', () => ({
  useTailoredMaterials: () => ({
    isGenerating: ref(false),
    loadTailoringContext: vi.fn(),
    generateTailoredCvForJob: vi.fn(),
  }),
}));

vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: class {
    list() {
      return Promise.resolve([
        {
          id: 'exp-1',
          title: 'Engineer',
          companyName: 'Acme',
          startDate: '2021-01-01',
          endDate: null,
          experienceType: 'work',
        },
      ]);
    }
  },
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
    { path: '/applications/cv/new', name: 'applications-cv-new', component: CvNewPage },
    {
      path: '/applications/cv/:id',
      name: 'applications-cv-id',
      component: { template: '<div />' },
    },
  ],
});

const stubs = {
  UPage: { template: '<div><slot /></div>' },
  UPageHeader: { props: ['title', 'description'], template: '<div><h1>{{ title }}</h1></div>' },
  UPageBody: { template: '<div><slot /></div>' },
  CvGenerateEntryCard: {
    emits: ['generate', 'edit-settings'],
    template:
      '<div><button data-testid="generate" @click="$emit(\'generate\')">Generate</button><button data-testid="settings" @click="$emit(\'edit-settings\')">Settings</button></div>',
  },
  CvGenerationModal: {
    props: ['open'],
    emits: ['update:open', 'confirm'],
    template:
      "<div><button v-if=\"open\" data-testid=\"confirm\" @click=\"$emit('confirm', { templateId: 'template-1', enabledSections: ['skills'], selectedExperienceIds: ['exp-1'] })\">Confirm</button></div>",
  },
};

const mountPage = async () => {
  await router.push('/applications/cv/new');
  await router.isReady();
  const wrapper = mount(CvNewPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
};

describe('CV new page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates with defaults when generate is clicked', async () => {
    const wrapper = await mountPage();

    await wrapper.find('[data-testid="generate"]').trigger('click');
    await flushPromises();

    expect(mockGenerateCv).toHaveBeenCalledWith('user-1', ['exp-1'], {
      enabledSections: ['summary', 'skills', 'experience', 'education', 'certifications', 'volunteer', 'projects', 'interests', 'links'],
      templateMarkdown: '# Template',
    });

    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'template-1',
        showProfilePhoto: true,
      })
    );
  });

  it('opens modal when edit settings is clicked', async () => {
    const wrapper = await mountPage();

    await wrapper.find('[data-testid="settings"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="confirm"]').exists()).toBe(true);
  });
});
