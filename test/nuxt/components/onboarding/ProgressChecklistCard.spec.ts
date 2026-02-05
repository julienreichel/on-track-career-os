import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressChecklistCard from '@/components/onboarding/ProgressChecklistCard.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div class="u-card"><slot /></div>' },
  UIcon: { template: '<span class="u-icon"></span>' },
  NuxtLink: {
    props: ['to'],
    template: '<a class="nuxt-link" :href="to"><slot /></a>',
  },
};

describe('ProgressChecklistCard', () => {
  it('renders phase 1 checklist items', () => {
    const wrapper = mount(ProgressChecklistCard, {
      props: {
        state: {
          phase: 'phase1',
          phase1: { isComplete: false, missing: ['cvUploaded'] },
          phase2: { isComplete: false, missing: ['profileDepth'] },
          phase3: { isComplete: false, missing: ['jobUploaded'] },
          phase4: { isComplete: false, missing: ['tailoredCv'] },
        },
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Upload a CV to get started');
    expect(wrapper.text()).toContain('Add at least 3 experiences');
  });
});
