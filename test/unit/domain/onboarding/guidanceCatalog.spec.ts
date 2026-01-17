import { describe, it, expect } from 'vitest';
import { getGuidance } from '@/domain/onboarding';
import type { UserProgressState } from '@/domain/onboarding';

const baseState = (overrides: Partial<UserProgressState> = {}): UserProgressState => ({
  phase: 'phase1',
  phase1: { isComplete: false, missing: ['profileBasics'] },
  phase2B: { isComplete: false, missing: ['profileDepth'] },
  phase2A: { isComplete: false, missing: ['jobUploaded'] },
  phase3: { isComplete: false, missing: ['tailoredCv'] },
  ...overrides,
});

describe('guidanceCatalog', () => {
  it('returns empty state for profile stories when none exist', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['stories'] },
    });
    const guidance = getGuidance('profile-stories', state, { storiesCount: 0 });
    expect(guidance.emptyState?.cta.to).toBe('/profile/stories/new');
  });

  it('returns locked guidance for profile stories when experiences are missing', () => {
    const state = baseState({
      phase1: { isComplete: false, missing: ['experienceCount'] },
      phase2B: { isComplete: false, missing: ['stories'] },
    });
    const guidance = getGuidance('profile-stories', state, { storiesCount: 0 });
    expect(guidance.lockedFeatures?.[0]?.id).toBe('stories-locked');
  });

  it('returns CV upload banner for profile experiences when CV is missing', () => {
    const state = baseState({
      phase1: { isComplete: false, missing: ['cvUploaded'] },
    });
    const guidance = getGuidance('profile-experiences', state, { experiencesCount: 0 });
    expect(guidance.banner?.cta?.to).toBe('/profile/cv-upload');
  });

  it('returns CV upload banner on profile when CV is missing', () => {
    const state = baseState({
      phase1: { isComplete: false, missing: ['cvUploaded'] },
    });
    const guidance = getGuidance('profile', state);
    expect(guidance.banner?.cta?.to).toBe('/profile/cv-upload');
  });

  it('returns locked canvas guidance when phase 2A is incomplete', () => {
    const guidance = getGuidance('profile-canvas', baseState(), { canvasCount: 0 });
    expect(guidance.lockedFeatures?.[0]?.id).toBe('canvas');
  });

  it('returns locked applications guidance when phase 3 is locked', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: ['jobUploaded'] },
      phase2B: { isComplete: false, missing: ['profileDepth'] },
    });
    const guidance = getGuidance('applications-cv', state, { cvCount: 0 });
    expect(guidance.lockedFeatures?.[0]?.id).toBe('cv-locked');
    expect(guidance.lockedFeatures?.[0]?.cta.to).toBe('/profile/full?mode=edit');
  });

  it('prioritizes missing stories for applications lock', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: [] },
      phase2B: { isComplete: false, missing: ['stories'] },
    });
    const guidance = getGuidance('applications-cover-letters', state, { coverLetterCount: 0 });
    expect(guidance.lockedFeatures?.[0]?.cta.to).toBe('/profile/stories');
  });

  it('returns empty jobs guidance when no jobs exist', () => {
    const guidance = getGuidance('jobs', baseState(), { jobsCount: 0 });
    expect(guidance.emptyState?.cta.to).toBe('/jobs/new');
  });
});
