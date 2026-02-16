import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PublicLayout from '@/layouts/public.vue';

describe('public layout', () => {
  it('renders layout with footer', () => {
    const wrapper = mount(PublicLayout, {
      global: {
        stubs: {
          UMain: { template: '<div class="main"><slot /></div>' },
          UContainer: { template: '<div class="container"><slot /></div>' },
          USeparator: { template: '<div class="separator" />' },
          UFooter: { template: '<div class="footer"><slot name="left" /><slot /></div>' },
          UNavigationMenu: { template: '<div class="nav-menu" />' },
        },
      },
    });

    expect(wrapper.find('.main').exists()).toBe(true);
    expect(wrapper.find('.footer').exists()).toBe(true);
    expect(wrapper.text()).toContain('On Track Career');
  });
});
