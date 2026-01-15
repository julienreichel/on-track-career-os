import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OnboardingPage from '@/pages/onboarding.vue';
import { createTestI18n } from '../../utils/createTestI18n';

const i18n = createTestI18n();

const stubs = {
  OnboardingWizard: {
    template: '<div class="onboarding-wizard-stub">Wizard</div>',
  },
};

describe('Onboarding Page', () => {
  it('renders the onboarding wizard container', () => {
    const wrapper = mount(OnboardingPage, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.onboarding-wizard-stub').exists()).toBe(true);
  });
});
