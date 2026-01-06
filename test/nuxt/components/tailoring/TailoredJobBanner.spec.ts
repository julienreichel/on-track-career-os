import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TailoredJobBanner from '@/components/tailoring/TailoredJobBanner.vue';

const stubs = {
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}</div>',
  },
  UButton: {
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')">{{ label }}</button>',
  },
};

describe('TailoredJobBanner', () => {
  it('renders labels and links', () => {
    const wrapper = mount(TailoredJobBanner, {
      props: {
        jobTitle: 'Lead Engineer',
        targetJobLabel: 'Target job',
        viewJobLabel: 'View job',
        viewMatchLabel: 'View match',
        jobLink: '/jobs/job-1',
        matchLink: '/jobs/job-1/match',
        regenerateLabel: 'Regenerate tailored CV',
        regenerateDisabled: false,
        regenerateLoading: false,
        contextErrorTitle: 'Unable to load job context',
        regenerateErrorTitle: 'Unable to regenerate tailored CV',
        missingSummaryTitle: 'Matching summary required',
        missingSummaryDescription: 'Generate a matching summary before regenerating this CV.',
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Target job');
    expect(wrapper.text()).toContain('Lead Engineer');
    expect(wrapper.text()).toContain('View job');
    expect(wrapper.text()).toContain('View match');
    expect(wrapper.text()).toContain('Regenerate tailored CV');
  });

  it('emits regenerate when button clicked', async () => {
    const wrapper = mount(TailoredJobBanner, {
      props: {
        jobTitle: 'Lead Engineer',
        targetJobLabel: 'Target job',
        viewJobLabel: 'View job',
        viewMatchLabel: 'View match',
        regenerateLabel: 'Regenerate tailored CV',
        regenerateDisabled: false,
        regenerateLoading: false,
        contextErrorTitle: 'Unable to load job context',
        regenerateErrorTitle: 'Unable to regenerate tailored CV',
        missingSummaryTitle: 'Matching summary required',
        missingSummaryDescription: 'Generate a matching summary before regenerating this CV.',
      },
      global: { stubs },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('regenerate')).toBeTruthy();
  });

  it('shows context error message when provided', () => {
    const wrapper = mount(TailoredJobBanner, {
      props: {
        jobTitle: 'Lead Engineer',
        targetJobLabel: 'Target job',
        viewJobLabel: 'View job',
        viewMatchLabel: 'View match',
        regenerateLabel: 'Regenerate tailored CV',
        regenerateDisabled: false,
        regenerateLoading: false,
        contextErrorTitle: 'Unable to load job context',
        regenerateErrorTitle: 'Unable to regenerate tailored CV',
        missingSummaryTitle: 'Matching summary required',
        missingSummaryDescription: 'Generate a matching summary before regenerating this CV.',
        contextError: 'Something went wrong',
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Unable to load job context');
    expect(wrapper.text()).toContain('Something went wrong');
  });
});
