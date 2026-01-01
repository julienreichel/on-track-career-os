import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import FitScoreVisualization from '@/components/matching/FitScoreVisualization.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  UProgress: {
    props: ['modelValue'],
    template: '<progress :value="modelValue" max="100"></progress>',
  },
};

describe('FitScoreVisualization', () => {
  it('renders score details when provided', () => {
    const wrapper = mount(FitScoreVisualization, {
      props: { score: 82.4 },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('82');
    expect(wrapper.find('progress').attributes('value')).toBe('82.4');
  });

  it('hides when no score is available', () => {
    const wrapper = mount(FitScoreVisualization, {
      props: { score: null },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.html()).toBe('<!--v-if-->');
  });
});
