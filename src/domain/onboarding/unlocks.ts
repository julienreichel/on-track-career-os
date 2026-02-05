import type { FeatureUnlocks, UserProgressState } from './types';

export function getUnlockableFeatures(state: UserProgressState): FeatureUnlocks {
  return {
    phase2Enabled: state.phase1.isComplete,
    phase4Enabled: state.phase2.isComplete && state.phase3.isComplete,
    bonusEnabled: state.phase4.isComplete,
  };
}
