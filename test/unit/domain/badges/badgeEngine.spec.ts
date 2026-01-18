import { describe, it, expect } from 'vitest';
import { computeEligibleBadges, diffBadges } from '@/domain/badges';
import type { ProgressInputs, UserProgressState } from '@/domain/onboarding';

const baseInputs: ProgressInputs = {
  profile: null,
  cvCount: 0,
  experiencesCount: 0,
  storiesCount: 0,
  personalCanvasCount: 0,
  jobsCount: 0,
  matchingSummaryCount: 0,
  tailoredCvCount: 0,
  tailoredCoverLetterCount: 0,
  tailoredSpeechCount: 0,
};

const baseState: UserProgressState = {
  phase: 'phase1',
  phase1: { isComplete: false, missing: ['cvUploaded', 'profileBasics', 'experienceCount'] },
  phase2A: { isComplete: false, missing: ['jobUploaded', 'matchingSummary'] },
  phase2B: { isComplete: false, missing: ['profileDepth', 'stories', 'personalCanvas'] },
  phase3: { isComplete: false, missing: ['tailoredCv', 'tailoredCoverLetter', 'tailoredSpeech'] },
};

describe('badge engine', () => {
  it('computes eligible badges based on progress inputs', () => {
    const inputs: ProgressInputs = {
      ...baseInputs,
      tailoredCvCount: 1,
    };
    const state: UserProgressState = {
      ...baseState,
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
    };

    const eligible = computeEligibleBadges(inputs, state);
    expect(eligible).toContain('grounded');
    expect(eligible).toContain('realityCheck');
    expect(eligible).toContain('selfAware');
    expect(eligible).toContain('cvTailored');
  });

  it('diffs newly earned badges from eligible list', () => {
    const existing = ['grounded', 'cvTailored'];
    const eligible = ['grounded', 'cvTailored', 'applicationReady'];
    const diff = diffBadges(existing, eligible);

    expect(diff.newlyEarned).toEqual(['applicationReady']);
    expect(diff.allEarned).toEqual(['grounded', 'cvTailored', 'applicationReady']);
  });
});
