import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OnboardingStepExperienceReview from '@/components/onboarding/steps/OnboardingStepExperienceReview.vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

const i18n = createTestI18n();

const experiences = [
  {
    title: 'Role 1',
    companyName: 'Company A',
    startDate: '2020-01',
    endDate: '2021-01',
    responsibilities: [],
    tasks: [],
    status: 'complete',
    experienceType: 'work',
  },
] as ExtractedExperience[];

describe('OnboardingStepExperienceReview', () => {
  it('emits removeExperience when preview removes an item', async () => {
    const wrapper = mount(OnboardingStepExperienceReview, {
      props: {
        experiences,
        isProcessing: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UButton: { template: '<button><slot /></button>' },
          StickyFooterCard: { template: '<div><slot /></div>' },
          CvExperiencesPreview: {
            name: 'CvExperiencesPreview',
            template: '<div class="cv-preview" />',
          },
        },
      },
    });

    await wrapper.findComponent({ name: 'CvExperiencesPreview' }).vm.$emit('remove', 0);

    const emitted = wrapper.emitted('removeExperience');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual([0]);
  });
});
