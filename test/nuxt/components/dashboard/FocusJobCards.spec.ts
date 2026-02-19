import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import FocusJobCards from '@/components/dashboard/FocusJobCards.vue';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';

const i18n = createTestI18n();

const stages: KanbanStage[] = [
  { key: 'todo', name: 'To start', isSystemDefault: true },
  { key: 'applied', name: 'Sent', isSystemDefault: false },
  { key: 'done', name: 'Closed', isSystemDefault: true },
];

const makeJob = (id: string, title: string, status: string): JobDescription =>
  ({
    id,
    title,
    kanbanStatus: status,
    createdAt: '2026-02-01T00:00:00.000Z',
    company: {
      id: `company-${id}`,
      companyName: `Company ${id}`,
    },
  }) as JobDescription;

describe('FocusJobCards', () => {
  it('renders at most 3 jobs and keeps stage labels based on stage keys', () => {
    const wrapper = mount(FocusJobCards, {
      props: {
        jobs: [
          makeJob('1', 'Role 1', 'applied'),
          makeJob('2', 'Role 2', 'todo'),
          makeJob('3', 'Role 3', 'done'),
          makeJob('4', 'Role 4', 'applied'),
        ],
        stages,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div class="item-card"><div>{{ title }}</div><div>{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          USkeleton: { template: '<div class="skeleton" />' },
          UBadge: { template: '<span class="badge"><slot /></span>' },
          UButton: {
            props: ['to', 'label'],
            template: '<a class="btn" :href="to">{{ label }}</a>',
          },
        },
      },
    });

    expect(wrapper.findAll('[data-testid^="focus-job-card-"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('Sent');
  });

  it('renders one pipeline link in header and job detail links per card', () => {
    const wrapper = mount(FocusJobCards, {
      props: {
        jobs: [makeJob('abc', 'Role A', 'todo')],
        stages,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div class="item-card"><div>{{ title }}</div><div>{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          USkeleton: { template: '<div class="skeleton" />' },
          UBadge: { template: '<span class="badge"><slot /></span>' },
          UButton: {
            props: ['to', 'label'],
            template: '<a class="btn" :href="to">{{ label }}</a>',
          },
        },
      },
    });

    const links = wrapper.findAll('a.btn').map((link) => link.attributes('href'));
    expect(links.filter((href) => href === '/pipeline')).toHaveLength(1);
    expect(links).toContain('/jobs/abc');
  });
});
