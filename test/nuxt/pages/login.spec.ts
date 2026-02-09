import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, reactive } from 'vue';
import LoginPage from '@/pages/login.vue';

const { useSeoMeta, useHead } = vi.hoisted(() => ({
  useSeoMeta: vi.fn(),
  useHead: vi.fn(),
}));

vi.mock('#app/composables/head', () => ({
  useSeoMeta,
  useHead,
}));

vi.mock('@/composables/useAuthState', () => ({
  useAuthState: () => ({
    isAuthenticated: ref(false),
  }),
}));

vi.mock('@aws-amplify/ui-vue', () => ({
  Authenticator: {
    template: '<div data-testid="authenticator" />',
  },
  useAuthenticator: () => reactive({ authStatus: 'unauthenticated' }),
}));

beforeEach(() => {
  useSeoMeta.mockReset();
  useHead.mockReset();
});

describe('Login Page', () => {
  it('sets a distinct title and description', () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          Authenticator: { template: '<div data-testid="authenticator" />' },
        },
      },
    });

    expect(wrapper.find('[data-testid="authenticator"]').exists()).toBe(true);
    const seoCall = useSeoMeta.mock.calls[0]?.[0];
    expect(seoCall?.title).toBeTruthy();
    expect(String(seoCall?.title)).toContain('Sign in');
    expect(seoCall?.description).toBeTruthy();
  });
});
