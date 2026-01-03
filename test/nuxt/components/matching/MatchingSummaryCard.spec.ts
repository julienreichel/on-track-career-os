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
  UIcon: {
    template: '<span class="u-icon" />',
  },
};

describe('MatchingSummaryCard', () => {
  it('renders the score and structured insights', () => {
    const wrapper = mount(MatchingSummaryCard, {
      props: {
        overallScore: 75,
        scoreBreakdown: {
          skillFit: 40,
          experienceFit: 25,
          interestFit: 5,
          edge: 5,
        },
        recommendation: 'apply',
        reasoningHighlights: ['Strong leadership experience', 'Good skill alignment'],
        strengthsForThisRole: ['Team leadership', 'Strategic thinking'],
        skillMatch: [
          '[MATCH] Leadership — demonstrated in role',
          '[PARTIAL] Architecture — some experience',
          '[MISSING] Domain expertise — needs development',
        ],
        riskyPoints: [
          'Risk: Limited scale experience. Mitigation: Emphasize growth trajectory.',
          'Risk: New domain. Mitigation: Show learning agility.',
        ],
        impactOpportunities: ['Improve team processes', 'Scale delivery'],
        tailoringTips: ['Highlight metrics', 'Address gaps proactively'],
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('75');
    expect(wrapper.text()).toContain('Strong leadership experience');
    expect(wrapper.text()).toContain('MATCH');
    expect(wrapper.text()).toContain('Leadership');
    expect(wrapper.text()).toContain('Limited scale experience');
  });

  it('shows default states when minimal data provided', () => {
    const wrapper = mount(MatchingSummaryCard, {
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('0');
    expect(wrapper.text()).toContain('⚠️');
  });
});
