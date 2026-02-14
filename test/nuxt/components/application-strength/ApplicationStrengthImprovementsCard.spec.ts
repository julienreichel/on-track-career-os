import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ApplicationStrengthImprovementsCard from '@/components/application-strength/ApplicationStrengthImprovementsCard.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
};

describe('ApplicationStrengthImprovementsCard', () => {
  it('renders improvement suggestions', () => {
    const wrapper = mount(ApplicationStrengthImprovementsCard, {
      props: {
        improvements: [
          {
            title: 'Improve summary',
            action: 'Add role-specific headline',
            impact: 'high',
            target: {
              document: 'cv',
              anchor: 'summary',
            },
          },
          {
            title: 'Add outcomes',
            action: 'Quantify achievements',
            impact: 'medium',
            target: {
              document: 'cv',
              anchor: 'experience',
            },
          },
        ],
      },
      global: {
        plugins: [createTestI18n()],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Improve summary');
    expect(wrapper.text()).toContain('Add outcomes');
    expect(wrapper.text()).toContain('Priority suggestions to improve your application quality.');
  });
});
