import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import KanbanJobCard from '@/components/pipeline/KanbanJobCard.vue';

const i18n = createTestI18n();

describe('KanbanJobCard', () => {
  it('renders title and company', () => {
    const wrapper = mount(KanbanJobCard, {
      props: {
        job: {
          id: 'job-1',
          title: 'Senior Engineer',
          createdAt: '2025-01-01T10:00:00Z',
          company: { companyName: 'Acme' },
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot /></div>' },
          UBadge: { template: '<span><slot /></span>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Senior Engineer');
    expect(wrapper.text()).toContain('Acme');
  });

  it('does not crash when matching summaries is not an array', () => {
    const wrapper = mount(KanbanJobCard, {
      props: {
        job: {
          id: 'job-2',
          title: 'Engineer',
          createdAt: '2025-01-01T10:00:00Z',
          matchingSummaries: {} as any,
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot /></div>' },
          UBadge: { template: '<span><slot /></span>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Engineer');
  });

  it('shows notes preview and emits open-note from note button', async () => {
    const wrapper = mount(KanbanJobCard, {
      props: {
        job: {
          id: 'job-3',
          title: 'Engineer',
          notes: 'Need to follow up after interview panel.',
          createdAt: '2025-01-01T10:00:00Z',
        },
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot /></div>' },
          UBadge: { template: '<span><slot /></span>' },
          UButton: {
            template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
            emits: ['click'],
          },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.find('[data-testid="kanban-note-preview-job-3"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('follow up');

    await wrapper.find('[data-testid="kanban-note-button-job-3"]').trigger('click');
    expect(wrapper.emitted('open-note')).toEqual([[{ jobId: 'job-3' }]]);
  });
});
