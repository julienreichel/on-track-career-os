import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmptyLayout from '@/layouts/empty.vue';

// Stub Nuxt UI components
const stubs = {
  UMain: {
    template: '<div class="u-main" data-testid="main"><slot /></div>',
  },
  UContainer: {
    template: '<div class="u-container" data-testid="container"><slot /></div>',
  },
};

describe('empty.vue layout', () => {
  it('should render the layout', () => {
    const wrapper = mount(EmptyLayout, {
      global: {
        stubs,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="main"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="container"]').exists()).toBe(true);
  });

  it('should render slot content', () => {
    const wrapper = mount(EmptyLayout, {
      slots: {
        default: '<div data-testid="test-content">Test Slot Content</div>',
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="test-content"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Slot Content');
  });

  it('should not display any buttons', () => {
    const wrapper = mount(EmptyLayout, {
      global: {
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(0);
  });

  it('should have minimal structure', () => {
    const wrapper = mount(EmptyLayout, {
      global: {
        stubs,
      },
    });

    // Should only have main and container
    expect(wrapper.find('[data-testid="main"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="container"]').exists()).toBe(true);

    // Should not have any text content
    expect(wrapper.text().trim()).toBe('');
  });

  it('should render multiple slot elements', () => {
    const wrapper = mount(EmptyLayout, {
      slots: {
        default: `
          <div>Element 1</div>
          <div>Element 2</div>
          <div>Element 3</div>
        `,
      },
      global: {
        stubs,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('Element 1');
    expect(text).toContain('Element 2');
    expect(text).toContain('Element 3');
  });

  it('should not contain any interactive elements by default', () => {
    const wrapper = mount(EmptyLayout, {
      global: {
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    const links = wrapper.findAll('a');
    const inputs = wrapper.findAll('input');

    expect(buttons.length).toBe(0);
    expect(links.length).toBe(0);
    expect(inputs.length).toBe(0);
  });

  it('should be suitable for authentication pages', () => {
    const wrapper = mount(EmptyLayout, {
      slots: {
        default: '<div data-testid="auth-form">Login Form</div>',
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="auth-form"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Login Form');
  });

  it('should handle empty slot gracefully', () => {
    const wrapper = mount(EmptyLayout, {
      slots: {
        default: '',
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="main"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="container"]').exists()).toBe(true);
  });
});
