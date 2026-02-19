import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import JobPreviewMiniCard from '@/components/dashboard/JobPreviewMiniCard.vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

const i18n = createTestI18n();

const stages: KanbanStage[] = [
  { key: 'todo', name: 'To start', isSystemDefault: true },
  { key: 'applied', name: 'Interview', isSystemDefault: false },
  { key: 'done', name: 'Closed', isSystemDefault: true },
];

const job = {
  id: 'job-1',
  title: 'Frontend Engineer',
  kanbanStatus: 'applied',
  updatedAt: '2026-02-11T00:00:00.000Z',
  company: {
    id: 'company-1',
    companyName: 'Acme',
  },
} as JobDescription;

describe('JobPreviewMiniCard', () => {
  it('shows stage label derived from settings stage name', () => {
    const wrapper = mount(JobPreviewMiniCard, {
      props: {
        job,
        stages,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
        },
      },
    });

    expect(wrapper.find('.badge').text()).toContain('Interview');
  });
});
