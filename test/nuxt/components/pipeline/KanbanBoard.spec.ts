import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import KanbanBoard from '@/components/pipeline/KanbanBoard.vue';

const i18n = createTestI18n();

describe('KanbanBoard', () => {
  it('keeps columns on one horizontal row with scroll container', () => {
    const wrapper = mount(KanbanBoard, {
      props: {
        columns: [
          { stage: { key: 'todo', name: 'ToDo', isSystemDefault: true }, jobs: [] },
          { stage: { key: 'applied', name: 'Applied', isSystemDefault: false }, jobs: [] },
          { stage: { key: 'interview', name: 'Interview', isSystemDefault: false }, jobs: [] },
          { stage: { key: 'offer', name: 'Offer', isSystemDefault: false }, jobs: [] },
          { stage: { key: 'done', name: 'Done', isSystemDefault: true }, jobs: [] },
        ],
      },
      global: {
        plugins: [i18n],
        stubs: {
          KanbanColumn: { template: '<div class="kanban-column-stub" />' },
        },
      },
    });

    const scroll = wrapper.find('[data-testid="kanban-board-scroll"]');
    expect(scroll.exists()).toBe(true);
    expect(scroll.classes()).toContain('overflow-x-auto');

    const row = wrapper.find('[data-testid="kanban-board"]');
    expect(row.classes()).toContain('flex');

    expect(wrapper.findAll('.kanban-column-stub')).toHaveLength(5);
    expect(wrapper.find('[data-testid="kanban-board-column-offer"]').exists()).toBe(true);
  });
});
