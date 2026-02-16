import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EulaPage from '@/pages/eula.vue';

describe('eula page', () => {
  it('renders EULA content', () => {
    const wrapper = mount(EulaPage, {
      global: {
        stubs: {
          UPage: { template: '<div class="page"><slot /></div>' },
          UPageBody: { template: '<div class="body"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.page').exists()).toBe(true);
    expect(wrapper.text()).toContain('End User License Agreement');
    expect(wrapper.text()).toContain('On Track Career');
  });
});
