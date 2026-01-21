import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvSettingsPage from '@/pages/settings/cv/index.vue';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';

const i18n = createTestI18n();

const settingsRef = ref({
  id: 'user-1',
  userId: 'user-1',
} as const);

const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn();

vi.mock('@/application/cvsettings/useCvSettings', () => ({
  useCvSettings: () => ({
    settings: settingsRef,
    loading: ref(false),
    error: ref(null),
    load: mockLoadSettings,
    saveSettings: mockSaveSettings,
  }),
}));

const templatesRef = ref<CVTemplate[]>([
  {
    id: 'template-1',
    name: 'Classic',
    content: '# Classic',
    source: 'user',
  } as CVTemplate,
]);
const mockLoadTemplates = vi.fn();
const mockCreateTemplate = vi.fn();
const mockCreateFromExemplar = vi.fn();
const mockUpdateTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();
const systemTemplatesRef = ref([
  {
    id: 'system:classic',
    name: 'Classic',
    description: 'Classic template',
    source: 'system:classic',
    content: '# Classic',
  },
]);

vi.mock('@/application/cvtemplate/useCvTemplates', () => ({
  useCvTemplates: () => ({
    templates: templatesRef,
    systemTemplates: systemTemplatesRef,
    loading: ref(false),
    error: ref(null),
    load: mockLoadTemplates,
    createFromExemplar: mockCreateFromExemplar,
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
    deleteTemplate: mockDeleteTemplate,
  }),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('user-1'),
    loadUserId: vi.fn(),
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
  routes: [{ path: '/settings/cv', name: 'settings-cv', component: CvSettingsPage }],
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
  UFormField: { template: '<div class="u-form-field"><slot /></div>' },
  USelect: {
    props: ['modelValue', 'items'],
    emits: ['update:modelValue'],
    template:
      '<select @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
  },
  UCheckbox: {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template:
      '<label><input type="checkbox" @change="$emit(\'update:modelValue\', !modelValue)" />{{ label }}</label>',
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  USwitch: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" @click="$emit(\'update:modelValue\', !modelValue)">toggle</button>',
  },
  UIcon: { template: '<span class="u-icon"></span>' },
  ListSkeletonCards: { template: '<div class="skeleton"></div>' },
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
        <button v-if="showDelete" data-testid="delete" @click="$emit('delete')">delete</button>
      </div>
    `,
  },
  ConfirmModal: { template: '<div class="confirm-modal"></div>' },
};

describe('CV Settings page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await router.push('/settings/cv');
    await router.isReady();
  });

  it('renders templates, sections, and experiences', async () => {
    const wrapper = mount(CvSettingsPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(mockLoadSettings).toHaveBeenCalled();
    expect(mockLoadTemplates).toHaveBeenCalled();
    expect(wrapper.text()).toContain(i18n.global.t('cvSettings.sections.other.title'));
    expect(wrapper.text()).toContain(i18n.global.t('cvTemplates.list.title'));
    expect(wrapper.text()).toContain('Classic');
    expect(wrapper.text()).toContain('Engineer');
  });

  it('saves settings and shows feedback', async () => {
    mockSaveSettings.mockResolvedValue({
      id: 'user-1',
      userId: 'user-1',
    });

    const wrapper = mount(CvSettingsPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    const form = wrapper.findComponent({ name: 'CvSettingsForm' });
    expect(form.exists()).toBe(true);
    await form.vm.$emit('save');
    await flushPromises();
    await flushPromises();

    expect(mockSaveSettings).toHaveBeenCalled();
  });
});
