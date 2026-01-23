import type { UserProgressState } from './types';

export type OnboardingStepId = 'cv-upload' | 'experience-review' | 'profile-basics' | 'complete';

export type OnboardingStep = {
  id: OnboardingStepId;
  labelKey: string;
  descriptionKey: string;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'cv-upload',
    labelKey: 'onboarding.steps.cvUpload.title',
    descriptionKey: 'onboarding.steps.cvUpload.description',
  },
  {
    id: 'experience-review',
    labelKey: 'onboarding.steps.experienceReview.title',
    descriptionKey: 'onboarding.steps.experienceReview.description',
  },
  {
    id: 'profile-basics',
    labelKey: 'onboarding.steps.profileBasics.title',
    descriptionKey: 'onboarding.steps.profileBasics.description',
  },
  {
    id: 'complete',
    labelKey: 'onboarding.steps.complete.title',
    descriptionKey: 'onboarding.steps.complete.description',
  },
];

export function getRequiredOnboardingStep(state: UserProgressState): OnboardingStepId {
  if (!state.phase1.isComplete) {
    if (state.phase1.missing.includes('cvUploaded')) {
      return 'cv-upload';
    }
    if (state.phase1.missing.includes('experienceCount')) {
      return 'experience-review';
    }
    return 'profile-basics';
  }

  return 'complete';
}

export function clampOnboardingStep(
  desired: OnboardingStepId,
  required: OnboardingStepId
): OnboardingStepId {
  const order = onboardingSteps.map((step) => step.id);
  const desiredIndex = order.indexOf(desired);
  const requiredIndex = order.indexOf(required);

  if (desiredIndex === -1 || requiredIndex === -1) {
    return required;
  }

  return desiredIndex > requiredIndex ? required : desired;
}

export function getOnboardingStepIndex(stepId: OnboardingStepId): number {
  return onboardingSteps.findIndex((step) => step.id === stepId);
}
