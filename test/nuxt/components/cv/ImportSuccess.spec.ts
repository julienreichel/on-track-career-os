import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import ImportSuccess from '~/components/cv/ImportSuccess.vue';

// Create i18n instance for tests
const i18n = createTestI18n();

// Stub Nuxt UI components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UIcon: {
    name: 'UIcon',
    template: '<span class="u-icon" />',
    props: ['name'],
  },
  UAlert: {
    name: 'UAlert',
    template: '<div class="u-alert">{{ title }}</div>',
    props: ['color', 'title'],
  },
  UButton: {
    name: 'UButton',
    template: '<button class="u-button" @click="$attrs.onClick"><slot>{{ label }}</slot></button>',
    props: ['label', 'icon', 'variant'],
  },
};

describe('ImportSuccess', () => {
  const createWrapper = (props = {}) => {
    return mount(ImportSuccess, {
      props: {
        createdCount: 3,
        updatedCount: 1,
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders the success header', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Creating experiences...');
  });

  it('displays success message with count', () => {
    const wrapper = createWrapper({ createdCount: 5, updatedCount: 2 });
    expect(wrapper.text()).toContain('Imported 5 experience(s), updated 2 experience(s)');
  });

  it('displays correct count for single experience', () => {
    const wrapper = createWrapper({ createdCount: 1, updatedCount: 0 });
    expect(wrapper.text()).toContain('Imported 1 experience(s), updated 0 experience(s)');
  });

  it('displays correct count for multiple experiences', () => {
    const wrapper = createWrapper({ createdCount: 10, updatedCount: 4 });
    expect(wrapper.text()).toContain('Imported 10 experience(s), updated 4 experience(s)');
  });

  it('renders view profile button', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.u-button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain('View Profile');
  });

  it('renders view experiences button', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.u-button');
    expect(buttons[1].text()).toContain('View Experiences');
  });

  it('emits viewProfile event when first button is clicked', async () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.u-button');

    await buttons[0].trigger('click');

    expect(wrapper.emitted('viewProfile')).toBeTruthy();
    expect(wrapper.emitted('viewProfile')?.[0]).toEqual([]);
  });

  it('emits viewExperiences event when second button is clicked', async () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.u-button');

    await buttons[1].trigger('click');

    expect(wrapper.emitted('viewExperiences')).toBeTruthy();
    expect(wrapper.emitted('viewExperiences')?.[0]).toEqual([]);
  });

  it('handles zero import count', () => {
    const wrapper = createWrapper({ createdCount: 0, updatedCount: 0 });
    expect(wrapper.text()).toContain('Imported 0 experience(s), updated 0 experience(s)');
  });

  it('displays success alert', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-alert').exists()).toBe(true);
  });

  it('renders success icon', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-icon').exists()).toBe(true);
  });
});
