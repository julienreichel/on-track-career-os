import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import ActiveJobsCard from '@/components/dashboard/ActiveJobsCard.vue';
import type { JobApplicationState } from '@/composables/useActiveJobsDashboard';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UButton: {
    props: ['label'],
    template: '<button class="u-button"><slot>{{ label }}</slot></button>',
  },
  UIcon: { template: '<span class="u-icon"></span>' },
  UList: { template: '<ul class="u-list"><slot /></ul>' },
  UListItem: { template: '<li class="u-list-item"><slot /></li>' },
  USkeleton: { template: '<div class="u-skeleton"></div>' },
};

describe('ActiveJobsCard', () => {
  it('renders active job rows and CTA', () => {
    const states: JobApplicationState[] = [
      {
        jobId: 'job-1',
        title: 'Lead Engineer',
        companyName: 'Acme Corp',
        matchStatus: 'ready',
        matchLabelKey: 'dashboard.activeJobs.match.ready',
        materials: { cv: true, coverLetter: false, speech: false },
        materialsMissing: ['coverLetter', 'speech'],
        cta: {
          labelKey: 'dashboard.activeJobs.cta.generateCoverLetter',
          to: '/applications/cover-letters/new?jobId=job-1',
        },
      },
    ];

    const wrapper = mount(ActiveJobsCard, {
      props: {
        states,
      },
      global: {
        plugins: [i18n],
        stubs: {
          ...stubs,
          JobApplicationStatusRow: {
            props: ['state'],
            template: '<div class="job-row">{{ state.title }} {{ state.cta.labelKey }}</div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('dashboard.activeJobs.title'));
    expect(wrapper.text()).toContain('Lead Engineer');
    expect(wrapper.text()).toContain('dashboard.activeJobs.cta.generateCoverLetter');
  });
});
