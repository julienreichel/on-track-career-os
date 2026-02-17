import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import KanbanColumn from '@/components/pipeline/KanbanColumn.vue';

const i18n = createTestI18n();

describe('KanbanColumn', () => {
  it('hides empty message when a job is present', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        stage: { key: 'applied', name: 'Applied', isSystemDefault: false },
        jobs: [],
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UBadge: { template: '<span><slot /></span>' },
          KanbanJobCard: { template: '<div class="job-card"></div>' },
        },
      },
    });

    expect(wrapper.find('[data-testid="kanban-empty-applied"]').exists()).toBe(true);

    await wrapper.setProps({
      jobs: [{ id: 'job-1', title: 'Role' }] as any,
    });

    expect(wrapper.find('[data-testid="kanban-empty-applied"]').exists()).toBe(false);
    expect(wrapper.find('.job-card').exists()).toBe(true);
  });
});
