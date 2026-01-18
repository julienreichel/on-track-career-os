import type { ProgressPhase } from '@/domain/onboarding';

export type BadgePhase = ProgressPhase | 'bonus';

export type BadgeId =
  | 'grounded'
  | 'realityCheck'
  | 'selfAware'
  | 'cvTailored'
  | 'letterCrafted'
  | 'pitchReady'
  | 'applicationReady';

export type BadgeDefinition = {
  id: BadgeId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  phase: BadgePhase;
};
