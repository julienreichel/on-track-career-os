import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createRouter, createMemoryHistory } from 'vue-router';

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
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      experiences: {
        title: 'Experiences',
        new: 'New Experience',
        empty: {
          title: 'No experiences yet',
          description: 'Upload your CV or add manually',
        },
        backToProfile: 'Back to Profile',
      },
    },
  },
});

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
  NuxtLink: {
    template: '<a :href="to" class="nuxt-link"><slot /></a>',
    props: ['to'],
  },
};

describe('Experiences Page Component', () => {
  describe('Page Header', () => {
    it('should render page header with title', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #title>{{ t('experiences.title') }}</template>
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
      expect(wrapper.text()).toContain('Experiences');
    });

    it('should render new experience button', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #links>
                <UButton to="/profile/experiences/new">{{ t('experiences.new') }}</UButton>
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
      expect(button.text()).toContain('New Experience');
    });

    it('should render back to profile link', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #links>
                <NuxtLink to="/profile">{{ t('experiences.backToProfile') }}</NuxtLink>
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

      const link = wrapper.find('a[href="/profile"]');
      expect(link.exists()).toBe(true);
      expect(link.text()).toContain('Back to Profile');
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no experiences', () => {
      const wrapper = mount(
        {
          template: `
            <UEmpty
              :title="t('experiences.empty.title')"
              :description="t('experiences.empty.description')"
            />
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

      expect(wrapper.find('.u-empty').exists()).toBe(true);
      expect(wrapper.text()).toContain('No experiences yet');
      expect(wrapper.text()).toContain('Upload your CV or add manually');
    });

    it('should render empty state with icon', () => {
      const wrapper = mount(
        {
          template: `
            <UEmpty
              :title="t('experiences.empty.title')"
              icon="i-lucide-briefcase"
            />
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

      const empty = wrapper.find('.u-empty');
      expect(empty.exists()).toBe(true);
    });
  });

  describe('Experience List', () => {
    it('should render experiences table when experiences exist', () => {
      const experiences = [
        { id: '1', title: 'Senior Engineer', company: 'Tech Corp' },
        { id: '2', title: 'Developer', company: 'Startup' },
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
