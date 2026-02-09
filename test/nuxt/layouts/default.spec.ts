import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import DefaultLayout from '@/layouts/default.vue';

// Create i18n instance for tests
const i18n = createTestI18n();

const { navigateTo } = vi.hoisted(() => ({
  navigateTo: vi.fn().mockResolvedValue(undefined),
}));

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $Amplify: {
      Auth: {
        signOut: vi.fn().mockResolvedValue(undefined),
      },
    },
  }),
  navigateTo,
}));

vi.mock('#app/composables/router', async () => {
  const actual = await vi.importActual<typeof import('#app/composables/router')>(
    '#app/composables/router'
  );
  return {
    ...actual,
    navigateTo,
  };
});

// Stub Nuxt UI components
const stubs = {
  UContainer: {
    template: '<div class="u-container" data-testid="container"><slot /></div>',
  },
  UHeader: {
    template:
      '<div class="u-header" data-testid="header"><div class="title"><slot name="title" /></div><div class="left"><slot name="left" /></div><div class="right"><slot name="right" /></div><slot /></div>',
  },
  UMain: {
    template: '<div class="u-main" data-testid="main"><slot /></div>',
  },
  UButton: {
    template: '<button data-testid="button" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
  NuxtLink: {
    template: '<a data-testid="nuxt-link" :to="to"><slot /></a>',
    props: ['to'],
  },
  UNavigationMenu: {
    template: '<div class="u-navigation-menu" data-testid="navigation-menu"><slot /></div>',
  },
  UBreadcrumb: {
    template: '<div class="u-breadcrumb" data-testid="breadcrumb"><slot /></div>',
  },
};

describe('default.vue layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the layout structure', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="container"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="main"]').exists()).toBe(true);
  });

  it('should display the app title from i18n', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('On Track Career');
  });

  it('should display the sign out button', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const signOutButton = wrapper
      .findAll('[data-testid="button"]')
      .find((button) => button.text().includes('Sign Out'));
    expect(signOutButton).toBeTruthy();
  });

  it('should render slot content', () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: '<div data-testid="slot-content">Test Content</div>',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Content');
  });

  it('should render with proper layout hierarchy', () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: '<div>Page content</div>',
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    // Should have header with title and button, plus slot content
    expect(wrapper.text()).toContain('On Track Career');
    expect(wrapper.text()).toContain('Sign Out');
    expect(wrapper.text()).toContain('Page content');
  });

  it('should have clickable sign out button', async () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const signOutButton = wrapper
      .findAll('[data-testid="button"]')
      .find((button) => button.text().includes('Sign Out'));
    expect(signOutButton).toBeTruthy();

    // Button should be clickable
    await signOutButton?.trigger('click');
    await flushPromises();
    expect(navigateTo).toHaveBeenCalledWith('/');
    // Note: Full sign out flow requires e2e testing with Amplify Auth
  });
});
