import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressBannerCard from '@/components/onboarding/ProgressBannerCard.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UButton: {
    props: ['label', 'to'],
    template: '<button class="u-button">{{ label }}</button>',
  },
};

describe('ProgressBannerCard', () => {
  it('renders phase label and primary CTA', () => {
    const wrapper = mount(ProgressBannerCard, {
      props: {
        state: {
          phase: 'phase1',
          phase1: { isComplete: false, missing: ['cvUploaded'] },
          phase2B: { isComplete: false, missing: ['profileDepth'] },
          phase2A: { isComplete: false, missing: ['jobUploaded'] },
          phase3: { isComplete: false, missing: ['tailoredCv'] },
        },
        nextAction: {
          phase: 'phase1',
          primary: {
            id: 'upload-cv',
            labelKey: 'progress.actions.uploadCv',
            rationaleKey: 'progress.rationale.cvUpload',
            to: '/profile/cv-upload',
          },
          missingPrerequisites: ['cvUploaded'],
        },
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Phase 1');
    expect(wrapper.text()).toContain('Upload your CV');
  });
});
