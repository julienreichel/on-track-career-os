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
          UButton: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
          KanbanJobCard: { template: '<div class="job-card"></div>' },
        },
      },
    });

    expect(wrapper.find('[data-testid="kanban-empty-applied"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="kanban-drop-empty-applied"]').exists()).toBe(true);

    await wrapper.setProps({
      jobs: [{ id: 'job-1', title: 'Role' }] as any,
    });

    expect(wrapper.find('[data-testid="kanban-empty-applied"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="kanban-drop-empty-applied"]').exists()).toBe(false);
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
          UButton: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
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

  it('shows 5 cards initially and reveals 5 more per click', async () => {
    const jobs = Array.from({ length: 12 }, (_, index) => ({
      id: `job-${index + 1}`,
      title: `Role ${index + 1}`,
    }));

    const wrapper = mount(KanbanColumn, {
      props: {
        stage: { key: 'applied', name: 'Applied', isSystemDefault: false },
        jobs: jobs as any,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UBadge: { template: '<span><slot /></span>' },
          UButton: {
            template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
            emits: ['click'],
          },
          KanbanJobCard: { template: '<div class="job-card"></div>' },
        },
      },
    });

    expect(wrapper.findAll('.job-card')).toHaveLength(5);
    expect(wrapper.find('[data-testid="kanban-show-more-applied"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="kanban-drop-tail-applied"]').exists()).toBe(false);

    await wrapper.find('[data-testid="kanban-show-more-applied"]').trigger('click');
    expect(wrapper.findAll('.job-card')).toHaveLength(10);
    expect(wrapper.find('[data-testid="kanban-drop-tail-applied"]').exists()).toBe(false);

    await wrapper.find('[data-testid="kanban-show-more-applied"]').trigger('click');
    expect(wrapper.findAll('.job-card')).toHaveLength(12);
    expect(wrapper.find('[data-testid="kanban-show-more-applied"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="kanban-drop-tail-applied"]').exists()).toBe(true);
  });
});
