import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import TodoPreviewSection from '@/components/dashboard/TodoPreviewSection.vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

const i18n = createTestI18n();

const stages: KanbanStage[] = [
  { key: 'todo', name: 'ToDo', isSystemDefault: true },
  { key: 'done', name: 'Done', isSystemDefault: true },
];

const makeJob = (id: string): JobDescription =>
  ({
    id,
    title: `Role ${id}`,
    kanbanStatus: 'todo',
  }) as JobDescription;

describe('TodoPreviewSection', () => {
  it('renders at most two previews and includes pipeline CTA', () => {
    const wrapper = mount(TodoPreviewSection, {
      props: {
        jobs: [makeJob('1'), makeJob('2'), makeJob('3')],
        stages,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          USkeleton: { template: '<div class="skeleton" />' },
          UButton: {
            props: ['to', 'label'],
            template: '<a class="pipeline-link" :href="to">{{ label }}</a>',
          },
          JobPreviewMiniCard: {
            props: ['job'],
            template: '<div class="job-mini">{{ job.id }}</div>',
          },
        },
      },
    });

    expect(wrapper.findAll('.job-mini')).toHaveLength(2);
    expect(wrapper.find('.pipeline-link').attributes('href')).toBe('/pipeline');
  });
});
