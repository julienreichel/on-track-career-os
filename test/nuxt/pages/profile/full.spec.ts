import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory, Router } from 'vue-router';
import { createTestI18n } from '../../../utils/createTestI18n';
import ProfileFullPage from '@/pages/profile/full.vue';

describe('ProfileFullPage', () => {
  let wrapper: VueWrapper;
  let router: Router;

  beforeEach(async () => {
    // Create router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/profile/full',
          name: 'profile-full',
          component: { template: '<div>Full</div>' },
        },
      ],
    });

    await router.push('/profile/full');
    await router.isReady();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = () => {
    wrapper = mount(ProfileFullPage, {
      global: {
        plugins: [router, createTestI18n()],
        stubs: {
          ProfileFullForm: true,
        },
      },
    });
  };

  describe('Component Lifecycle', () => {
    it('should mount successfully', () => {
      mountComponent();
      expect(wrapper.exists()).toBe(true);
    });

    it('should have correct component name', () => {
      mountComponent();
      expect(wrapper.vm.$options.name).toBe('ProfileFullPage');
    });
  });

  describe('Template Rendering', () => {
    it('should render ProfileFullForm component', () => {
      mountComponent();
      const form = wrapper.findComponent({ name: 'ProfileFullForm' });
      expect(form.exists()).toBe(true);
    });
  });
});
