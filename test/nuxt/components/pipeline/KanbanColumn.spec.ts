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

  it('accepts drops on bottom area when cards already exist', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        stage: { key: 'applied', name: 'Applied', isSystemDefault: false },
        jobs: [{ id: 'job-1', title: 'Role' }] as any,
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

    const dropTail = wrapper.find('[data-testid="kanban-drop-tail-applied"]');
    expect(dropTail.exists()).toBe(true);

    await dropTail.trigger('drop', {
      dataTransfer: {
        getData: () => 'job-2',
      },
      preventDefault: () => {},
    });

    expect(wrapper.emitted('drop')).toEqual([[{ jobId: 'job-2', toStageKey: 'applied' }]]);
  });
});
