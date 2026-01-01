import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MatchingSummaryCard from '@/components/matching/MatchingSummaryCard.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
};

describe('MatchingSummaryCard', () => {
  it('renders the summary and list items', () => {
    const wrapper = mount(MatchingSummaryCard, {
      props: {
        summaryParagraph: 'You can create value in weeks.',
        impactAreas: ['Improve onboarding'],
        contributionMap: ['Mentor engineers'],
        riskMitigationPoints: ['Ramp up on domain knowledge'],
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('You can create value in weeks.');
    expect(wrapper.findAll('li')).toHaveLength(3);
  });

  it('shows empty states when nothing is provided', () => {
    const wrapper = mount(MatchingSummaryCard, {
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('No narrative available yet.');
    expect(wrapper.text()).toContain('No impact areas identified');
    expect(wrapper.text()).toContain('No contributions mapped yet');
    expect(wrapper.text()).toContain('No risks documented');
  });
});
