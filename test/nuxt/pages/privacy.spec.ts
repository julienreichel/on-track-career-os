import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrivacyPage from '@/pages/privacy.vue';

describe('privacy page', () => {
  it('renders Privacy Policy content', () => {
    const wrapper = mount(PrivacyPage, {
      global: {
        stubs: {
          UPage: { template: '<div class="page"><slot /></div>' },
          UPageBody: { template: '<div class="body"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.page').exists()).toBe(true);
    expect(wrapper.text()).toContain('Privacy Policy');
    expect(wrapper.text()).toContain('On Track Career');
  });
});
