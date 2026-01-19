import { describe, it, expect } from 'vitest';
import { getNextAction } from '@/domain/onboarding';
import type { UserProgressState } from '@/domain/onboarding';

const baseState = (overrides: Partial<UserProgressState> = {}): UserProgressState => ({
  phase: 'phase1',
  phase1: { isComplete: false, missing: ['cvUploaded'] },
  phase2B: { isComplete: false, missing: ['profileDepth'] },
  phase2A: { isComplete: false, missing: ['jobUploaded'] },
  phase3: { isComplete: false, missing: ['tailoredCv'] },
  ...overrides,
});

describe('getNextAction', () => {
  it('returns CV upload as primary when phase 1 is incomplete', () => {
    const action = getNextAction(baseState());
    expect(action.primary.id).toBe('upload-cv');
    expect(action.primary.to).toBe('/profile/cv-upload');
  });

  it('returns profile depth when phase 2A is incomplete', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['profileDepth'] },
      phase2A: { isComplete: true, missing: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('profile-depth');
  });

  it('returns job upload when phase 2B is incomplete', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: ['jobUploaded'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('upload-job');
  });

  it('returns add experiences when phase 1 is missing experience count', () => {
    const state = baseState({
      phase: 'phase1',
      phase1: { isComplete: false, missing: ['experienceCount'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('add-experiences');
  });

  it('returns complete profile when only profile basics are missing', () => {
    const state = baseState({
      phase: 'phase1',
      phase1: { isComplete: false, missing: ['profileBasics'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('complete-profile');
  });

  it('returns generate match when job is uploaded but match is missing', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: false, missing: ['matchingSummary'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('generate-match');
  });

  it('returns add stories when phase 2B is missing stories', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['stories'] },
      phase2A: { isComplete: true, missing: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('add-stories');
  });

  it('returns build canvas when profile depth and stories are complete', () => {
    const state = baseState({
      phase: 'phase2',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: false, missing: ['personalCanvas'] },
      phase2A: { isComplete: true, missing: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('build-canvas');
  });

  it('returns tailored materials CTA for phase 3', () => {
    const state = baseState({
      phase: 'phase3',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase3: { isComplete: false, missing: ['tailoredCv'] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('tailor-materials');
  });

  it('returns bonus CTA when all phases complete', () => {
    const state = baseState({
      phase: 'bonus',
      phase1: { isComplete: true, missing: [] },
      phase2B: { isComplete: true, missing: [] },
      phase2A: { isComplete: true, missing: [] },
      phase3: { isComplete: true, missing: [] },
    });
    const action = getNextAction(state);
    expect(action.primary.id).toBe('optimize-materials');
  });
});
