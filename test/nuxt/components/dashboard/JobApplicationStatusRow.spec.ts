import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import JobApplicationStatusRow from '@/components/dashboard/JobApplicationStatusRow.vue';

const pushMock = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const stubs = {
  UCard: {
    template:
      '<div class="u-card" @click="$emit(\'click\', $event)"><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UButton: {
    props: ['label'],
    template: '<button type="button"><slot>{{ label }}</slot></button>',
  },
  UIcon: { template: '<span class="u-icon"></span>' },
};

describe('JobApplicationStatusRow', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  const state = {
    jobId: 'job-1',
    title: 'Lead Engineer',
    companyName: 'Acme',
    matchStatus: 'ready',
    matchLabelKey: 'dashboard.activeJobs.match.ready',
    materials: { cv: true, coverLetter: false, speech: false },
    materialsMissing: ['coverLetter', 'speech'],
    cta: {
      labelKey: 'dashboard.activeJobs.cta.generateCoverLetter',
      to: '/applications/cover-letters/new?jobId=job-1',
    },
  };

  it('navigates to job detail when clicking the card', async () => {
    const wrapper = mount(JobApplicationStatusRow, {
      props: { state },
      global: { plugins: [createTestI18n()], stubs },
    });

    await wrapper.find('.u-card').trigger('click');

    expect(pushMock).toHaveBeenCalledWith('/jobs/job-1');
  });

  it('does not navigate when clicking a footer action', async () => {
    const wrapper = mount(JobApplicationStatusRow, {
      props: { state },
      global: { plugins: [createTestI18n()], stubs },
    });

    const buttons = wrapper.findAll('button');
    await buttons[0]?.trigger('click');

    expect(pushMock).not.toHaveBeenCalled();
  });
});
