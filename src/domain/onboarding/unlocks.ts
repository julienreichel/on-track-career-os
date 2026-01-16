import type { FeatureUnlocks, UserProgressState } from './types';

export function getUnlockableFeatures(state: UserProgressState): FeatureUnlocks {
  return {
    phase2Enabled: state.phase1.isComplete,
    phase3Enabled: state.phase2B.isComplete && state.phase2A.isComplete,
    bonusEnabled: state.phase3.isComplete,
  };
}
