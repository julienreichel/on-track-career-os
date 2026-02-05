import type { ProgressInputs, UserProgressState } from '@/domain/onboarding';
import { badgeCatalog } from './catalog';
import type { BadgeId } from './types';

export function computeEligibleBadges(inputs: ProgressInputs, state: UserProgressState): BadgeId[] {
  const eligible = new Set<BadgeId>();

  // Phase 1: Grounded (CV uploaded + 3 experiences + basics filled)
  if (state.phase1.isComplete) {
    eligible.add('grounded');
  }

  // Phase 2A: Job Clarity (first job uploaded + matching summary viewed)
  if (state.phase3.isComplete) {
    eligible.add('jobClarity');
  }

  // Phase 2B: Identity Defined (personal canvas created)
  if (state.phase2.isComplete) {
    eligible.add('identityDefined');
  }

  // Phase 3: Application Complete (CV + letter + speech for same job)
  if (state.phase4.isComplete) {
    eligible.add('applicationComplete');
  }

  // Bonus: Beyond the CV (first manually created story, not from CV import)
  // This checks if total stories > stories from CV import
  // Note: CV import stories are tracked separately, manual stories expand the narrative
  if (inputs.storyCount > inputs.experienceCount) {
    eligible.add('beyondTheCv');
  }

  // Bonus: Company Strategist (company canvas created)
  if (inputs.companyCanvasCount > 0) {
    eligible.add('companyStrategist');
  }

  // Bonus: Custom Approach (custom template used)
  // This is tracked by checking if any tailored materials have custom flag
  // For now, we check if user has created materials and has modified templates
  const hasTailoredMaterials =
    inputs.tailoredCvCount > 0 ||
    inputs.tailoredCoverLetterCount > 0 ||
    inputs.tailoredSpeechCount > 0;
  if (hasTailoredMaterials && inputs.hasCustomTemplate) {
    eligible.add('customApproach');
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
