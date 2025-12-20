import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import ParsingStep from '~/components/cv/ParsingStep.vue';

// Create i18n instance for tests
const i18n = createTestI18n();


// Stub Nuxt UI components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  USkeleton: {
    name: 'USkeleton',
    template: '<div class="u-skeleton" />',
  },
};

describe('ParsingStep', () => {
  const createWrapper = () => {
    return mount(ParsingStep, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders the parsing message', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Parsing your CV...');
  });

  it('renders the parsing description', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('AI is extracting your experiences and information.');
  });

  it('displays multiple skeleton loaders', () => {
    const wrapper = createWrapper();
    const skeletons = wrapper.findAll('.u-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders within a card component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-card').exists()).toBe(true);
  });
});
