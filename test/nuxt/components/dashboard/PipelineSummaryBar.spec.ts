import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import PipelineSummaryBar from '@/components/dashboard/PipelineSummaryBar.vue';

const i18n = createTestI18n();

describe('PipelineSummaryBar', () => {
  it('renders todo, active, and done counts', () => {
    const wrapper = mount(PipelineSummaryBar, {
      props: {
        counts: {
          todoCount: 4,
          activeCount: 2,
          doneCount: 7,
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          USkeleton: { template: '<div class="skeleton" />' },
        },
      },
    });

    expect(wrapper.find('[data-testid="pipeline-summary-todo"]').text()).toContain('4');
    expect(wrapper.find('[data-testid="pipeline-summary-active"]').text()).toContain('2');
    expect(wrapper.find('[data-testid="pipeline-summary-done"]').text()).toContain('7');
  });
});
