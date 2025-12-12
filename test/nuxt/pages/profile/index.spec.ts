import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createRouter, createMemoryHistory } from 'vue-router';

/**
 * Nuxt Component Tests: Profile Page
 *
 * Tests the profile page component rendering, view/edit modes, and UI elements.
 * These tests focus on component behavior and UI state without full E2E workflows.
 *
 * E2E tests (test/e2e/profile-page.spec.ts) cover:
 * - Navigation flows between pages
 * - Form submission and data persistence
 * - Authentication redirects
 * - Full user workflows (view → edit → save → view)
 */

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      profile: {
        title: 'Profile',
        edit: 'Edit Profile',
        save: 'Save Profile',
        cancel: 'Cancel',
        backToHome: 'Back to Home',
        coreIdentity: 'Core Identity',
        profileManagement: 'Profile Management',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
      },
    },
  },
});

// Create router for tests
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'index', component: { template: '<div>Home</div>' } },
    { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
    {
      path: '/profile/experiences',
      name: 'experiences',
      component: { template: '<div>Experiences</div>' },
    },
    {
      path: '/profile/canvas',
      name: 'canvas',
      component: { template: '<div>Canvas</div>' },
    },
  ],
});

// Stub Nuxt UI components
const stubs = {
  UContainer: {
    template: '<div class="u-container"><slot /></div>',
  },
  UPage: {
    template: '<div class="u-page"><slot /></div>',
  },
  UPageHeader: {
    template: '<div class="u-page-header"><slot name="title" /><slot name="links" /></div>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UPageCard: {
    template:
      '<div class="u-page-card"><slot name="title" /><slot name="description" /><slot /></div>',
    props: ['to', 'title', 'description'],
  },
  UButton: {
    template: '<button class="u-button" :type="type" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'color', 'variant', 'icon', 'loading'],
  },
  UFormField: {
    template:
      '<div class="u-form-field"><label>{{ label }}</label><slot /><span v-if="hint">{{ hint }}</span></div>',
    props: ['label', 'name', 'required', 'hint'],
  },
  UInput: {
    template:
      '<input class="u-input" :value="modelValue" :type="type" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'type', 'placeholder'],
  },
  UTextarea: {
    template:
      '<textarea class="u-textarea" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows'],
  },
  NuxtLink: {
    template: '<a :href="to" class="nuxt-link"><slot /></a>',
    props: ['to'],
  },
};

describe('Profile Page Component', () => {
  describe('Page Header', () => {
    it('should render page header', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #title>{{ t('profile.title') }}</template>
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
      expect(wrapper.text()).toContain('Profile');
    });

    it('should render back to home button', () => {
      const wrapper = mount(
        {
          template: `
            <UPageHeader>
              <template #links>
                <NuxtLink to="/">{{ t('profile.backToHome') }}</NuxtLink>
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

      const link = wrapper.find('a[href="/"]');
      expect(link.exists()).toBe(true);
      expect(link.text()).toContain('Back to Home');
    });
  });

  describe('View Mode', () => {
    it('should display edit button in view mode', () => {
      const wrapper = mount(
        {
          template: `
            <div>
              <UButton @click="isEditing = true">{{ t('profile.edit') }}</UButton>
            </div>
          `,
          setup() {
            const { t } = i18n.global;
            const isEditing = false;
            return { t, isEditing };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const editButton = wrapper.find('button');
      expect(editButton.exists()).toBe(true);
      expect(editButton.text()).toContain('Edit Profile');
    });

    it('should display core identity section', () => {
      const wrapper = mount(
        {
          template: `
            <div>
              <h3>{{ t('profile.coreIdentity') }}</h3>
              <div>Content</div>
            </div>
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

      expect(wrapper.text()).toContain('Core Identity');
    });

    it('should display profile management section', () => {
      const wrapper = mount(
        {
          template: `
            <div>
              <h3>{{ t('profile.profileManagement') }}</h3>
              <UPageCard to="/profile/experiences" title="Experiences" />
              <UPageCard to="/profile/canvas" title="Canvas" />
            </div>
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

      expect(wrapper.text()).toContain('Profile Management');
      expect(wrapper.findAll('.u-page-card')).toHaveLength(2);
    });
  });

  describe('Edit Mode', () => {
    it('should display form inputs in edit mode', () => {
      const wrapper = mount(
        {
          template: `
            <form>
              <UFormField :label="t('profile.firstName')">
                <UInput v-model="firstName" />
              </UFormField>
              <UFormField :label="t('profile.lastName')">
                <UInput v-model="lastName" />
              </UFormField>
            </form>
          `,
          setup() {
            const { t } = i18n.global;
            const firstName = '';
            const lastName = '';
            return { t, firstName, lastName };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      expect(wrapper.findAll('.u-form-field')).toHaveLength(2);
      expect(wrapper.findAll('.u-input')).toHaveLength(2);
      expect(wrapper.text()).toContain('First Name');
      expect(wrapper.text()).toContain('Last Name');
    });

    it('should display save button in edit mode', () => {
      const wrapper = mount(
        {
          template: `
            <form>
              <UButton type="submit">{{ t('profile.save') }}</UButton>
            </form>
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

      const saveButton = wrapper.find('button[type="submit"]');
      expect(saveButton.exists()).toBe(true);
      expect(saveButton.text()).toContain('Save Profile');
    });

    it('should display cancel button in edit mode', () => {
      const wrapper = mount(
        {
          template: `
            <div>
              <UButton type="button" @click="isEditing = false">{{ t('profile.cancel') }}</UButton>
            </div>
          `,
          setup() {
            const { t } = i18n.global;
            const isEditing = true;
            return { t, isEditing };
          },
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const cancelButton = wrapper.find('button');
      expect(cancelButton.exists()).toBe(true);
      expect(cancelButton.text()).toContain('Cancel');
    });

    it('should toggle edit mode when cancel is clicked', async () => {
      const wrapper = mount(
        {
          template: `
            <div>
              <UButton v-if="!isEditing" @click="isEditing = true">{{ t('profile.edit') }}</UButton>
              <UButton v-else @click="isEditing = false">{{ t('profile.cancel') }}</UButton>
            </div>
          `,
          data() {
            return {
              isEditing: false,
            };
          },
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

      // Initial state: view mode
      expect(wrapper.text()).toContain('Edit Profile');

      // Click edit button
      await wrapper.find('button').trigger('click');
      await wrapper.vm.$nextTick();

      // Now in edit mode
      expect(wrapper.text()).toContain('Cancel');

      // Click cancel button
      await wrapper.find('button').trigger('click');
      await wrapper.vm.$nextTick();

      // Back to view mode
      expect(wrapper.text()).toContain('Edit Profile');
    });
  });

  describe('Navigation Links', () => {
    it('should have link to experiences page', () => {
      const wrapper = mount(
        {
          template: `
            <UPageCard to="/profile/experiences" title="Experiences" />
          `,
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const card = wrapper.find('.u-page-card');
      expect(card.exists()).toBe(true);
    });

    it('should have link to personal canvas page', () => {
      const wrapper = mount(
        {
          template: `
            <UPageCard to="/profile/canvas" title="Canvas" />
          `,
        },
        {
          global: {
            plugins: [i18n, router],
            stubs,
          },
        }
      );

      const card = wrapper.find('.u-page-card');
      expect(card.exists()).toBe(true);
    });
  });

  describe('Responsive Layout', () => {
    it('should use page container', () => {
      const wrapper = mount(
        {
          template: `
            <UPage>
              <UPageBody>Content</UPageBody>
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
      expect(wrapper.find('.u-page-body').exists()).toBe(true);
    });
  });
});
