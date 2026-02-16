import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard.vue';
import { useOnboardingWizard } from '@/composables/useOnboardingWizard';

vi.mock('@/composables/useOnboardingWizard');

describe('OnboardingWizard', () => {
  const i18n = createTestI18n();

  const mockWizard = {
    load: vi.fn(),
    steps: { value: [] },
    stepIndex: { value: 0 },
    currentStep: { value: 'cv-upload' },
    error: { value: null },
    isProcessing: { value: false },
    parsing: {
      extractedExperiences: { value: [] },
      removeExperience: vi.fn(),
      updateExperience: vi.fn(),
    },
    handleCvFile: vi.fn(),
    importExperiences: vi.fn(),
    back: vi.fn(),
    finish: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOnboardingWizard).mockReturnValue(mockWizard as never);
  });

  it('renders correctly', () => {
    mockWizard.steps.value = [
      { labelKey: 'onboarding.steps.cvUpload.label', descriptionKey: 'onboarding.steps.cvUpload.description' },
    ];

    const wrapper = mount(OnboardingWizard, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div class="page-header" />' },
          UPageBody: { template: '<div><slot /></div>' },
          UStepper: { template: '<div class="stepper" />' },
          OnboardingStepCvUpload: { template: '<div class="cv-upload-step" />' },
        },
      },
    });

    expect(wrapper.find('.page-header').exists()).toBe(true);
    expect(wrapper.find('.stepper').exists()).toBe(true);
  });

  it('loads wizard on mount', () => {
    mount(OnboardingWizard, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div />' },
          UPageBody: { template: '<div><slot /></div>' },
          UStepper: { template: '<div />' },
          OnboardingStepCvUpload: { template: '<div />' },
        },
      },
    });

    expect(mockWizard.load).toHaveBeenCalled();
  });

  it('displays error when present', () => {
    mockWizard.error.value = 'onboarding.errors.uploadFailed';
    mockWizard.steps.value = [];

    const wrapper = mount(OnboardingWizard, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div />' },
          UPageBody: { template: '<div><slot /></div>' },
          UStepper: { template: '<div />' },
          UAlert: { template: '<div class="error-alert"><slot /></div>' },
          OnboardingStepCvUpload: { template: '<div />' },
        },
      },
    });

    expect(wrapper.find('.error-alert').exists()).toBe(true);
  });
});
