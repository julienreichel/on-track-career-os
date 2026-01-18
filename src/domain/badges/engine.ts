import type { ProgressInputs, UserProgressState } from '@/domain/onboarding';
import { badgeCatalog } from './catalog';
import type { BadgeId } from './types';

export function computeEligibleBadges(
  inputs: ProgressInputs,
  state: UserProgressState
): BadgeId[] {
  const eligible = new Set<BadgeId>();

  if (state.phase1.isComplete) {
    eligible.add('grounded');
  }
  if (state.phase2A.isComplete) {
    eligible.add('realityCheck');
  }
  if (state.phase2B.isComplete) {
    eligible.add('selfAware');
  }
  if (inputs.tailoredCvCount > 0) {
    eligible.add('cvTailored');
  }
  if (inputs.tailoredCoverLetterCount > 0) {
    eligible.add('letterCrafted');
  }
  if (inputs.tailoredSpeechCount > 0) {
    eligible.add('pitchReady');
  }
  if (state.phase3.isComplete) {
    eligible.add('applicationReady');
  }

  return badgeCatalog.map((badge) => badge.id).filter((id) => eligible.has(id));
}

export function diffBadges(existing: BadgeId[], eligible: BadgeId[]) {
  const existingSet = new Set(existing);
  const eligibleSet = new Set(eligible);

  const newlyEarned = eligible.filter((id) => !existingSet.has(id));
  const allEarned = [...existingSet, ...newlyEarned].filter((id, index, array) => {
    return array.indexOf(id) === index && eligibleSet.has(id);
  });

  return {
    newlyEarned,
    allEarned,
  };
}
