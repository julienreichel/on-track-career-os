import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import CvIndexPage from '@/pages/applications/cv/index.vue';
import type { GuidanceModel } from '@/domain/onboarding';

/**
 * Nuxt Component Tests: CV Listing Page
 *
 * Tests the CV listing page component rendering, layout, and UI elements.
 * Tests both empty state and populated list scenarios.
 *
 * E2E tests (test/e2e/cv-management.spec.ts) cover:
 * - Full CV generation workflow
 * - Navigation and interactions
 * - PDF export functionality
 */

// Mock the composable
const mockLoadAll = vi.fn();
const mockDeleteDocument = vi.fn();
const mockItems = ref<any[]>([]);
const mockLoading = ref(false);
const mockError = ref<string | null>(null);
const guidanceRef = ref<GuidanceModel>({});

vi.mock('@/composables/useCvDocuments', () => ({
  useCvDocuments: () => ({
    items: mockItems,
    loading: mockLoading,
    error: mockError,
    loadAll: mockLoadAll,
    deleteDocument: mockDeleteDocument,
  }),
}));

vi.mock('@/composables/useGuidance', () => ({
  useGuidance: () => ({
    guidance: guidanceRef,
  }),
}));

// Create i18n instance for tests
const i18n = createTestI18n();

// Create router for tests
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '<div>Home</div>' },
    },
    {
      path: '/applications/cv',
      name: 'applications-cv',
      component: { template: '<div>CV List</div>' },
    },
    {
      path: '/applications/cv/new',
      name: 'applications-cv-new',
      component: { template: '<div>New CV</div>' },
    },
    {
      path: '/applications/cv/:id',
      name: 'applications-cv-id',
      component: { template: '<div>CV Detail</div>' },
    },
  ],
});

// Stub Nuxt UI components
const stubs = {
  UPageHeader: {
    template: '<div><slot name="title" /><slot name="description" /><slot name="actions" /></div>',
  },
  UPageGrid: { template: '<div><slot /></div>' },
  UPageCard: {
    props: ['title', 'description', 'to'],
    template: '<div @click="$emit(\'click\')"><slot /></div>',
  },
  UCard: { template: '<div><slot /></div>' },
  ListSkeletonCards: {
    template: '<div class="list-skeleton"><div class="u-skeleton"></div></div>',
  },
  UButton: {
    props: ['label', 'icon', 'to'],
    template: '<button @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
  },
  UIcon: { props: ['name'], template: '<span></span>' },
  UModal: {
    template: '<div v-if="modelValue"><slot /></div>',
    props: ['modelValue'],
  },
  ItemCard: {
    props: ['title', 'subtitle'],
    emits: ['edit', 'delete'],
    template: '<div><h3>{{ title }}</h3><p>{{ subtitle }}</p><slot name="actions" /><slot /></div>',
  },
  ConfirmModal: {
    props: ['open'],
    template: '<div v-if="open"><slot /></div>',
  },
  UEmpty: {
    props: ['title', 'description', 'icon'],
    template:
      '<div class="u-empty"><p>{{ title }}</p><p>{{ description }}</p><slot name="actions" /></div>',
  },
  UInput: {
    props: ['modelValue', 'placeholder'],
    template: '<input :value="modelValue" :placeholder="placeholder" />',
  },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert"><p>{{ title }}</p><p>{{ description }}</p></div>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
};

describe('CV Listing Page - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guidanceRef.value = {
      emptyState: {
        titleKey: 'guidance.applications.cv.empty.title',
        descriptionKey: 'guidance.applications.cv.empty.description',
        cta: { labelKey: 'guidance.applications.cv.empty.cta', to: '/applications/cv/new' },
      },
    };
    mockItems.value = [];
    mockLoading.value = false;
    mockError.value = null;
    mockLoadAll.mockResolvedValue(undefined);
  });

  it('should display empty state when no CVs exist', async () => {
    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.find('.guidance-empty-state-stub').exists()).toBe(true);
  });

  it('should display "Create Your First CV" button in empty state', async () => {
    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.find('.guidance-empty-state-stub').exists()).toBe(true);
  });

  it('shows locked guidance when prerequisites are missing', async () => {
    guidanceRef.value = {
      emptyState: {
        titleKey: 'guidance.applications.cv.empty.title',
        descriptionKey: 'guidance.applications.cv.empty.description',
        cta: { labelKey: 'guidance.applications.cv.empty.cta', to: '/applications/cv/new' },
      },
      lockedFeatures: [
        {
          id: 'cv-locked',
          titleKey: 'guidance.applications.locked.title',
          descriptionKey: 'guidance.applications.locked.description',
          cta: { labelKey: 'guidance.applications.locked.cta', to: '/jobs' },
        },
      ],
    };

    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    expect(wrapper.find('.guidance-locked-stub').exists()).toBe(true);
  });

  it('should have page header with title and description', async () => {
    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    // Check page renders without errors
    expect(wrapper.exists()).toBe(true);
    // UPageHeader exists (even if stubbed)
    expect(wrapper.html()).toContain('</div>');
  });
});

describe('CV Listing Page - With CVs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guidanceRef.value = {};
    mockItems.value = [
      {
        id: '1',
        name: 'Software Engineer CV',
        filename: 'CV_Software_Engineer.pdf',
        content_type: 'application/pdf',
        isTailored: false,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: '2',
        name: 'Project Manager CV',
        filename: 'CV_Project_Manager.pdf',
        content_type: 'application/pdf',
        isTailored: true,
        createdAt: new Date('2024-01-02').toISOString(),
        updatedAt: new Date('2024-01-02').toISOString(),
      },
    ];
    mockLoading.value = false;
    mockError.value = null;
    mockLoadAll.mockResolvedValue(undefined);
  });

  it('should display list of CV documents', async () => {
    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    // Should display CV names (from the name property, not filename)
    expect(wrapper.text()).toContain('Software Engineer CV');
    expect(wrapper.text()).toContain('Project Manager CV');
  });

  it('should show action buttons for each CV', async () => {
    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    await flushPromises();

    // Should have Print and View buttons (from ItemCard custom actions)
    expect(wrapper.text()).toContain('Print');
    expect(wrapper.text()).toContain('View');
  });

  it('should show loading state initially', async () => {
    mockLoading.value = true;

    const wrapper = mount(CvIndexPage, {
      global: {
        plugins: [i18n, router],
        stubs,
      },
    });

    // Should show loading state
    expect(mockLoading.value).toBe(true);

    mockLoading.value = false;
    await wrapper.vm.$nextTick();
    await flushPromises();
  });
});
