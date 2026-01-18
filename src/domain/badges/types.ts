import type { ProgressPhase } from '@/domain/onboarding';

export type BadgePhase = ProgressPhase | 'bonus';

export type BadgeId =
  | 'grounded'
  | 'jobClarity'
  | 'identityDefined'
  | 'applicationComplete'
  | 'beyondTheCv'
  | 'companyStrategist'
  | 'customApproach';

export type BadgeDefinition = {
  id: BadgeId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  phase: BadgePhase;
};
