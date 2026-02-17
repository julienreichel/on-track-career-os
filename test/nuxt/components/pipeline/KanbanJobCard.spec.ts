import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import KanbanJobCard from '@/components/pipeline/KanbanJobCard.vue';

const i18n = createTestI18n();

describe('KanbanJobCard', () => {
  it('renders title, company, and created date', () => {
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
    expect(wrapper.text()).toContain('Created');
  });
});
