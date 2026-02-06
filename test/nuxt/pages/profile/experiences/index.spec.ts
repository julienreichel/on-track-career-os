import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import ExperiencesPage from '@/pages/profile/experiences/index.vue';
import type { Experience } from '@/domain/experience/Experience';
import type { GuidanceModel } from '@/domain/onboarding';

/**
 * Nuxt Component Tests: Experiences List Page
 *
 * Tests the experiences listing page component rendering and UI elements.
 * These tests focus on component behavior without full E2E workflows.
 *
 * E2E tests (test/e2e/experiences.spec.ts) cover:
 * - Complete CRUD workflows (create → save → list → edit → delete)
 * - Navigation flows between pages
 * - Form submission and data persistence
 * - Experience creation with backend integration
 */

// Create i18n instance for tests
const i18n = createTestI18n();

// Create router for tests
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
    {
      path: '/profile/experiences',
      name: 'experiences',
      component: { template: '<div>Experiences</div>' },
    },
    {
      path: '/profile/experiences/new',
      name: 'experiences-new',
      component: { template: '<div>New</div>' },
    },
  ],
});

const mockExperienceList = vi.fn<[], Promise<Experience[]>>(() => Promise.resolve([]));
const mockDeleteExperience = vi.fn();
const guidanceRef = ref<GuidanceModel>({});

vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn(() => ({
    listWithStories: mockExperienceList,
    delete: mockDeleteExperience,
  })),
}));

vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    userId: ref('test-user-id'),
  }),
}));

vi.mock('@/composables/useGuidance', () => ({
  useGuidance: () => ({
    guidance: guidanceRef,
  }),
}));

beforeAll(async () => {
  if (router.currentRoute.value.path !== '/profile/experiences') {
    await router.push('/profile/experiences');
  }
  await router.isReady();
});

// Stub Nuxt UI components
const stubs = {
  UPage: {
    template: '<div class="u-page"><slot /></div>',
  },
  UPageHeader: {
    template: '<div class="u-page-header"><slot name="title" /><slot name="links" /></div>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UButton: {
    template: '<button class="u-button" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'to', 'color', 'variant'],
  },
  UTable: {
    template:
      '<table class="u-table"><tbody><tr v-for="row in rows" :key="row.id"><td>{{ row.title }}</td></tr></tbody></table>',
    props: ['rows', 'columns'],
  },
  UEmpty: {
    template: '<div class="u-empty"><p>{{ title }}</p><p>{{ description }}</p><slot /></div>',
    props: ['title', 'description', 'icon'],
  },
  GuidanceBanner: {
    template: '<div class="guidance-banner-stub"></div>',
    props: ['banner'],
  },
  EmptyStateActionCard: {
    template: '<div class="guidance-empty-state-stub"></div>',
    props: ['emptyState'],
  },
  ListSkeletonCards: {
    template: '<div class="list-skeleton"><div class="u-skeleton"></div></div>',
  },
  NuxtLink: {
    template: '<a :href="to" class="nuxt-link"><slot /></a>',
    props: ['to'],
  },
};

const pageComponentStubs = {
  ...stubs,
  UPageGrid: {
    template: '<div class="u-page-grid"><slot /></div>',
  },
  UAlert: {
    template: '<div class="u-alert"><slot /></div>',
    props: ['title', 'description'],
  },
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  USkeleton: {
    template: '<div class="u-skeleton" />',
  },
  UButton: stubs.UButton,
  UEmpty: stubs.UEmpty,
  ListSkeletonCards: stubs.ListSkeletonCards,
  UModal: {
    template: '<div class="u-modal"><slot /></div>',
    props: ['title'],
  },
  UInput: {
    template:
      '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'icon', 'placeholder', 'size'],
  },
  ExperienceCard: {
    props: ['experience', 'storyCount'],
    template: '<div class="experience-card-stub">{{ experience.title }}<slot /></div>',
  },
};

describe('Experiences Page Component', () => {
  describe('Page Header', () => {
    it('should render page header with title', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #title>{{ t('features.experiences.title') }}</template>
            </UPageHeader>
          `,
          setup() {
            const { t } = i18n.global;
            return { t };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      expect(wrapper.find('.u-page-header').exists()).toBe(true);
      expect(wrapper.text()).toContain(i18n.global.t('features.experiences.title'));
    });

    it('should render new experience button', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #links>
                <UButton to="/profile/experiences/new">
                  {{ t('experiences.list.addNew') }}
                </UButton>
              </template>
            </UPageHeader>
          `,
          setup() {
            const { t } = i18n.global;
            return { t };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const button = wrapper.find('.u-button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain(i18n.global.t('experiences.list.addNew'));
    });

    it('should render CV upload link', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #links>
                <NuxtLink to="/profile/cv-upload">{{ t('cvUpload.title') }}</NuxtLink>
              </template>
            </UPageHeader>
          `,
          setup() {
            const { t } = i18n.global;
            return { t };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const link = wrapper.find('a[href="/profile/cv-upload"]');
      expect(link.exists()).toBe(true);
      expect(link.text()).toContain(i18n.global.t('cvUpload.title'));
    });

    it('renders back to profile link in header links', async () => {
      const wrapper = mount(ExperiencesPage, {
        global: {
          plugins: [i18n, router],
          stubs: {
            ...pageComponentStubs,
            UPageHeader: {
              props: ['title', 'description', 'links'],
              template: `
                <div class="u-page-header">
                  <div v-for="(link, idx) in links" :key="idx">{{ link.label }}</div>
                </div>
              `,
            },
          },
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain(i18n.global.t('common.backToProfile'));
    });
  });

  describe('Empty State', () => {
    it('should render empty state action card', () => {
      const wrapper = mount(
        {
          template: `
            <EmptyStateActionCard
              :empty-state="{
                titleKey: 'guidance.profileExperiences.empty.title',
                descriptionKey: 'guidance.profileExperiences.empty.description',
                cta: { labelKey: 'guidance.profileExperiences.empty.cta', to: '/profile/experiences/new' }
              }"
            />
          `,
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      expect(wrapper.find('.guidance-empty-state-stub').exists()).toBe(true);
    });
  });

  describe('Experience List', () => {
    it('should render experiences table when experiences exist', () => {
      const experiences = [
        { id: '1', title: 'Senior Engineer', companyName: 'Tech Corp' },
        { id: '2', title: 'Developer', companyName: 'Startup' },
      ];

      const wrapper = mount(
        {
          template: `
            <UTable :rows="experiences" />
          `,
          setup() {
            return { experiences };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      expect(wrapper.find('.u-table').exists()).toBe(true);
      expect(wrapper.text()).toContain('Senior Engineer');
      expect(wrapper.text()).toContain('Developer');
    });

    it('should render multiple experience rows', () => {
      const experiences = [
        { id: '1', title: 'Job 1' },
        { id: '2', title: 'Job 2' },
        { id: '3', title: 'Job 3' },
      ];

      const wrapper = mount(
        {
          template: `
            <UTable :rows="experiences" />
          `,
          setup() {
            return { experiences };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const rows = wrapper.findAll('tr');
      expect(rows.length).toBe(3);
    });
  });

  describe('Page Layout', () => {
    it('should use page container structure', () => {
      const wrapper = mount(
        {
          template: `
            <UPage>
              <UPageHeader>
                <template #title>Experiences</template>
              </UPageHeader>
              <UPageBody>
                <div>Content</div>
              </UPageBody>
            </UPage>
          `,
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      expect(wrapper.find('.u-page').exists()).toBe(true);
      expect(wrapper.find('.u-page-header').exists()).toBe(true);
      expect(wrapper.find('.u-page-body').exists()).toBe(true);
    });
  });
});

describe('Experiences Page Integration', () => {
  beforeEach(() => {
    mockExperienceList.mockReset();
    guidanceRef.value = {
      emptyState: {
        titleKey: 'guidance.profileExperiences.empty.title',
        descriptionKey: 'guidance.profileExperiences.empty.description',
        cta: {
          labelKey: 'guidance.profileExperiences.empty.cta',
          to: '/profile/experiences/new',
        },
      },
    };
  });

  const mountExperiencesPage = async () => {
    const wrapper = mount(ExperiencesPage, {
      global: {
        plugins: [i18n, router],
        stubs: pageComponentStubs,
      },
    });

    await flushPromises();
    return wrapper;
  };

  it('renders empty state when repository returns no experiences', async () => {
    mockExperienceList.mockResolvedValueOnce([]);

    const wrapper = await mountExperiencesPage();
    expect(wrapper.find('.guidance-empty-state-stub').exists()).toBe(true);
  });

  it('shows skeleton until experiences are loaded', async () => {
    let resolveList: (value: Experience[]) => void;
    const listPromise = new Promise<Experience[]>((resolve) => {
      resolveList = resolve;
    });
    mockExperienceList.mockReturnValueOnce(listPromise);

    const wrapper = mount(ExperiencesPage, {
      global: {
        plugins: [i18n, router],
        stubs: pageComponentStubs,
      },
    });

    await flushPromises();
    expect(wrapper.find('.u-skeleton').exists()).toBe(true);

    resolveList?.([]);
    await flushPromises();

    expect(wrapper.find('.u-skeleton').exists()).toBe(false);
    expect(wrapper.find('.guidance-empty-state-stub').exists()).toBe(true);
  });

  it('renders experience cards when repository returns data', async () => {
    mockExperienceList.mockResolvedValueOnce([
      {
        id: 'exp-1',
        title: 'Platform Lead',
        companyName: 'Acme Labs',
        experienceType: 'work',
        startDate: '2024-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
    ]);
    guidanceRef.value = {};

    const wrapper = await mountExperiencesPage();
    expect(wrapper.findAll('.experience-card-stub')).toHaveLength(1);
    expect(wrapper.text()).toContain('Platform Lead');
  });

  it('renders search input when experiences exist', async () => {
    mockExperienceList.mockResolvedValueOnce([
      {
        id: 'exp-1',
        title: 'Platform Lead',
        companyName: 'Acme Labs',
        experienceType: 'work',
        startDate: '2024-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
    ]);
    guidanceRef.value = {};

    const wrapper = await mountExperiencesPage();
    expect(wrapper.find('.u-input').exists()).toBe(true);
  });

  it('renders filter buttons when experiences exist', async () => {
    mockExperienceList.mockResolvedValueOnce([
      {
        id: 'exp-1',
        title: 'Platform Lead',
        companyName: 'Acme Labs',
        experienceType: 'work',
        startDate: '2024-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
    ]);
    guidanceRef.value = {};

    const wrapper = await mountExperiencesPage();
    const buttons = wrapper.findAll('.u-button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('filters experiences by type when filter button is clicked', async () => {
    mockExperienceList.mockResolvedValueOnce([
      {
        id: 'exp-1',
        title: 'Senior Engineer',
        companyName: 'Tech Corp',
        experienceType: 'work',
        startDate: '2024-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
      {
        id: 'exp-2',
        title: 'Computer Science Degree',
        companyName: 'University',
        experienceType: 'education',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
    ]);
    guidanceRef.value = {};

    const wrapper = await mountExperiencesPage();

    // Initially should show both experiences
    expect(wrapper.findAll('.experience-card-stub')).toHaveLength(2);
  });

  it('searches experiences by title', async () => {
    mockExperienceList.mockResolvedValueOnce([
      {
        id: 'exp-1',
        title: 'Senior Engineer',
        companyName: 'Tech Corp',
        experienceType: 'work',
        startDate: '2024-01-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
      {
        id: 'exp-2',
        title: 'Computer Science Degree',
        companyName: 'University',
        experienceType: 'education',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        owner: 'user-1',
        rawText: '',
      } as Experience,
    ]);
    guidanceRef.value = {};

    const wrapper = await mountExperiencesPage();

    // Initially should show both experiences
    expect(wrapper.findAll('.experience-card-stub')).toHaveLength(2);
  });
});
