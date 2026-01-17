export type {
  FeatureUnlocks,
  NextAction,
  NextActionItem,
  ProgressCheckResult,
  ProgressGate,
  ProgressInputs,
  ProgressPhase,
  UserProgressState,
} from './types';
export { computeUserProgressState } from './progress';
export { getNextAction } from './nextAction';
export { getUnlockableFeatures } from './unlocks';
export {
  onboardingSteps,
  getOnboardingStepIndex,
  getRequiredOnboardingStep,
  clampOnboardingStep,
} from './onboardingWizard';
export type { OnboardingStep, OnboardingStepId } from './onboardingWizard';
export type {
  GuidanceBanner,
  GuidanceCTA,
  GuidanceContext,
  GuidanceEmptyState,
  GuidanceModel,
  GuidanceRouteKey,
  LockedFeature,
} from './guidanceCatalog';
export { getGuidance } from './guidanceCatalog';
