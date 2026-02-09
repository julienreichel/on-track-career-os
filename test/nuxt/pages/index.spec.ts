import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import LandingPage from '@/pages/index.vue';
import landingRedirect from '@/middleware/landing-redirect.client';
import { AUTHENTICATED_HOME } from '@/utils/authRouting';

const stubs = {
  UPage: {
    template: '<main class="u-page"><slot /></main>',
  },
  UPageBody: {
    template: '<div class="u-page-body"><slot /></div>',
  },
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  UButton: {
    template: '<button class="u-button" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
};

const navigateTo = vi.fn();
const isAuthenticated = ref(false);

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo: (...args: unknown[]) => navigateTo(...args),
}));

vi.mock('@/composables/useAuthState', () => ({
  useAuthState: () => ({
    refresh: vi.fn().mockResolvedValue(undefined),
    isAuthenticated,
  }),
}));

beforeEach(() => {
  navigateTo.mockReset();
  isAuthenticated.value = false;
});

describe('Landing Page', () => {
  it('renders the landing hero for anonymous users', () => {
    const wrapper = mount(LandingPage, {
      global: {
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="landing-hero"]').exists()).toBe(true);
  });

  it('redirects authenticated users to the app home', async () => {
    isAuthenticated.value = true;
    await landingRedirect();

    expect(navigateTo).toHaveBeenCalledWith(AUTHENTICATED_HOME);
  });
});
