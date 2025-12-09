import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import SingleBadge from '~/components/cv/SingleBadge.vue';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvUpload: {
        profile: {
          removeItem: 'Remove',
        },
      },
    },
  },
});

// Stub Nuxt UI components
const stubs = {
  UBadge: {
    name: 'UBadge',
    template: '<span class="u-badge"><slot /></span>',
    props: ['color', 'variant'],
  },
  UButton: {
    name: 'UButton',
    template: '<button class="u-button" @click="$attrs.onClick"><slot /></button>',
    props: ['icon', 'size', 'color', 'variant'],
  },
};

describe('SingleBadge', () => {
  const createWrapper = (props = {}) => {
    return mount(SingleBadge, {
      props: {
        label: 'Test Label',
        value: 'Test Value',
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders the label', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Test Label');
  });

  it('renders the value', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Test Value');
  });

  it('displays label and value separately', () => {
    const wrapper = createWrapper({ label: 'Name', value: 'John Doe' });
    expect(wrapper.text()).toContain('Name');
    expect(wrapper.text()).toContain('John Doe');
  });

  it('renders remove button', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-button').exists()).toBe(true);
  });

  it('emits remove event when button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.u-button').trigger('click');

    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')?.[0]).toEqual([]);
  });

  it('handles long values', () => {
    const longValue = 'This is a very long value that should still be displayed correctly';
    const wrapper = createWrapper({ value: longValue });
    expect(wrapper.text()).toContain(longValue);
  });

  it('handles special characters in value', () => {
    const specialValue = 'Value with <special> & characters';
    const wrapper = createWrapper({ value: specialValue });
    expect(wrapper.text()).toContain('special');
  });
});
