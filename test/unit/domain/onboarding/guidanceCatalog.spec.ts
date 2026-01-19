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

  it('returns profile basics banner when CV is uploaded but basics are missing', () => {
    const state = baseState({
      phase1: { isComplete: false, missing: ['profileBasics'] },
    });
    const guidance = getGuidance('profile', state);
    expect(guidance.banner?.cta?.to).toBe('/profile/full?mode=edit');
  });

  it('returns profile depth banner when phase 2B is incomplete', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['profileDepth'] },
    });
    const guidance = getGuidance('profile', state);
    expect(guidance.banner?.cta?.to).toBe('/profile/full?mode=edit');
  });

  it('returns personal canvas banner after profile depth and stories are complete', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['personalCanvas'] },
    });
    const guidance = getGuidance('profile', state);
    expect(guidance.banner?.cta?.to).toBe('/profile/canvas');
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

  it('returns matching summary lock when jobs exist but match is missing', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: ['matchingSummary'] },
      phase2B: { isComplete: true, missing: [] },
    });
    const guidance = getGuidance('applications-cv', state, { cvCount: 0 });
    expect(guidance.lockedFeatures?.[0]?.cta.to).toBe('/jobs');
  });

  it('returns CV empty state when unlocked and no CVs exist', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
    });
    const guidance = getGuidance('applications-cv', state, { cvCount: 0 });
    expect(guidance.emptyState?.cta.to).toBe('/applications/cv/new');
    expect(guidance.lockedFeatures).toBeUndefined();
  });

  it('returns no empty state when CVs exist', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
    });
    const guidance = getGuidance('applications-cv', state, { cvCount: 1 });
    expect(guidance.emptyState).toBeUndefined();
  });

  it('returns no empty state when cover letters exist', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
    });
    const guidance = getGuidance('applications-cover-letters', state, { coverLetterCount: 2 });
    expect(guidance.emptyState).toBeUndefined();
  });

  it('returns empty guidance for speech when unlocked', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
    });
    const guidance = getGuidance('applications-speech', state, { speechCount: 1 });
    expect(guidance.lockedFeatures).toBeUndefined();
    expect(guidance.emptyState).toBeUndefined();
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

  it('returns job detail banner when match is missing', () => {
    const state = baseState({
      phase1: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: ['matchingSummary'] },
    });
    const guidance = getGuidance('job-detail', state, {
      jobId: 'job-1',
      hasMatchingSummary: false,
    });
    expect(guidance.banner?.cta?.to).toBe('/jobs/job-1/match');
  });
});
