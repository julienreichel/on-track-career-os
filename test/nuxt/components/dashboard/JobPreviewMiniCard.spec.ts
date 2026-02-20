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
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
          UButton: {
            props: ['to', 'label'],
            emits: ['click'],
            template: '<button class="btn" :data-to="to" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

    expect(wrapper.find('.badge').text()).toContain('Interview');
  });

  it('shows generate speech and move-next actions for in-progress stages', () => {
    const wrapper = mount(JobPreviewMiniCard, {
      props: {
        job,
        stages,
        enableWorkflowActions: true,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
          UButton: {
            props: ['to', 'label'],
            emits: ['click'],
            template: '<button class="btn" :data-to="to" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

    const targets = wrapper.findAll('button.btn').map((link) => link.attributes('data-to'));
    expect(targets).toContain('/applications/speech/new?jobId=job-1');
    expect(wrapper.text()).toContain('Move to Closed');
  });

  it('shows only cover letter generation when both cv and cover letter are missing', () => {
    const wrapper = mount(JobPreviewMiniCard, {
      props: {
        job: {
          ...job,
          id: 'job-2',
          kanbanStatus: 'todo',
        },
        stages,
        enableWorkflowActions: true,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
          UButton: {
            props: ['to', 'label'],
            emits: ['click'],
            template: '<button class="btn" :data-to="to" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

    const targets = wrapper.findAll('button.btn').map((link) => link.attributes('data-to'));
    expect(targets).toContain('/applications/cover-letters/new?jobId=job-2');
    expect(targets).not.toContain('/applications/cv/new?jobId=job-2');
    expect(wrapper.text()).toContain('Move to Interview');
  });

  it('shows generate cv once cover letter already exists', () => {
    const wrapper = mount(JobPreviewMiniCard, {
      props: {
        job: {
          ...job,
          id: 'job-2b',
          kanbanStatus: 'todo',
          coverLetters: [{ id: 'cl-1' }],
        },
        stages,
        enableWorkflowActions: true,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
          UButton: {
            props: ['to', 'label'],
            emits: ['click'],
            template: '<button class="btn" :data-to="to" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

    const targets = wrapper.findAll('button.btn').map((link) => link.attributes('data-to'));
    expect(targets).toContain('/applications/cv/new?jobId=job-2b');
    expect(targets).not.toContain('/applications/cover-letters/new?jobId=job-2b');
  });

  it('does not show generate actions when materials already exist', () => {
    const wrapper = mount(JobPreviewMiniCard, {
      props: {
        job: {
          ...job,
          id: 'job-3',
          kanbanStatus: 'todo',
          cvs: [{ id: 'cv-1' }],
          coverLetters: [{ id: 'cl-1' }],
          speechBlocks: [{ id: 'sb-1' }],
        },
        stages,
        enableWorkflowActions: true,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
          UButton: {
            props: ['to', 'label'],
            emits: ['click'],
            template: '<button class="btn" :data-to="to" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

    const targets = wrapper.findAll('button.btn').map((link) => link.attributes('data-to'));
    expect(targets).not.toContain('/applications/cv/new?jobId=job-3');
    expect(targets).not.toContain('/applications/cover-letters/new?jobId=job-3');
    expect(targets).not.toContain('/applications/speech/new?jobId=job-3');
  });

  it('emits moveToStage when move action is clicked', async () => {
    const wrapper = mount(JobPreviewMiniCard, {
      props: {
        job: {
          ...job,
          id: 'job-4',
          kanbanStatus: 'todo',
        },
        stages,
        enableWorkflowActions: true,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ItemCard: {
            props: ['title', 'subtitle'],
            template:
              '<div><div class="title">{{ title }}</div><div class="subtitle">{{ subtitle }}</div><slot name="badges" /><slot /><slot name="actions" /></div>',
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
          },
          UButton: {
            props: ['to', 'label'],
            emits: ['click'],
            template: '<button class="btn" :data-to="to" @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

    const moveButton = wrapper.find('[data-testid="preview-move-next-link-job-4"]');
    await moveButton.trigger('click');

    expect(wrapper.emitted('moveToStage')).toEqual([
      [{ jobId: 'job-4', toStageKey: 'applied' }],
    ]);
  });
});
