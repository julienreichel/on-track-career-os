import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import BadgeList from '~/components/cv/BadgeList.vue';

// Create i18n instance for tests
const i18n = createTestI18n();


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

describe('BadgeList', () => {
  const createWrapper = (props = {}) => {
    return mount(BadgeList, {
      props: {
        label: 'Skills',
        items: ['JavaScript', 'TypeScript', 'Vue.js'],
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
    expect(wrapper.text()).toContain('Skills');
  });

  it('renders all items', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('JavaScript');
    expect(wrapper.text()).toContain('TypeScript');
    expect(wrapper.text()).toContain('Vue.js');
  });

  it('displays correct number of badges', () => {
    const wrapper = createWrapper();
    const badges = wrapper.findAll('.u-badge');
    expect(badges.length).toBe(3);
  });

  it('renders remove button for each item', () => {
    const wrapper = createWrapper();
    const removeButtons = wrapper.findAll('.u-button');
    expect(removeButtons.length).toBe(3);
  });

  it('emits remove event with correct index when button is clicked', async () => {
    const wrapper = createWrapper();
    const removeButtons = wrapper.findAll('.u-button');

    await removeButtons[1].trigger('click');

    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')?.[0]).toEqual([1]);
  });

  it('handles empty items array', () => {
    const wrapper = createWrapper({ items: [] });
    const badges = wrapper.findAll('.u-badge');
    expect(badges.length).toBe(0);
  });

  it('handles single item', () => {
    const wrapper = createWrapper({ items: ['Single Item'] });
    expect(wrapper.text()).toContain('Single Item');
    const badges = wrapper.findAll('.u-badge');
    expect(badges.length).toBe(1);
  });

  it('emits correct index for first item', async () => {
    const wrapper = createWrapper();
    const removeButtons = wrapper.findAll('.u-button');

    await removeButtons[0].trigger('click');

    expect(wrapper.emitted('remove')?.[0]).toEqual([0]);
  });

  it('emits correct index for last item', async () => {
    const wrapper = createWrapper();
    const removeButtons = wrapper.findAll('.u-button');

    await removeButtons[2].trigger('click');

    expect(wrapper.emitted('remove')?.[0]).toEqual([2]);
  });

  it('handles items with special characters', () => {
    const specialItems = ['Item <1>', 'Item & 2', 'Item "3"'];
    const wrapper = createWrapper({ items: specialItems });
    expect(wrapper.text()).toContain('Item');
  });

  it('renders with custom label', () => {
    const wrapper = createWrapper({ label: 'Custom Label' });
    expect(wrapper.text()).toContain('Custom Label');
  });
});
