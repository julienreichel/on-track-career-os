import { describe, it, expect } from 'vitest';
import { computeUserProgressState } from '@/domain/onboarding';
import type { ProgressInputs } from '@/domain/onboarding';

const baseProfile = {
  fullName: 'Casey Candidate',
  primaryEmail: 'casey@example.com',
  primaryPhone: '555-0100',
  workPermitInfo: 'US Citizen',
  socialLinks: ['https://linkedin.com/in/casey'],
  skills: ['Leadership'],
  languages: ['English'],
  strengths: ['Coaching'],
  goals: ['Lead teams'],
  aspirations: ['CTO'],
  personalValues: ['Trust'],
  interests: ['AI'],
  certifications: ['PMP'],
  headline: 'Engineering Leader',
  location: 'Remote',
  seniorityLevel: 'Director',
};

const baseInputs = (overrides: Partial<ProgressInputs> = {}): ProgressInputs => ({
  profile: baseProfile as ProgressInputs['profile'],
  cvCount: 1,
  experiencesCount: 3,
  storiesCount: 1,
  personalCanvasCount: 1,
  jobsCount: 1,
  matchingSummaryCount: 1,
  tailoredCvCount: 1,
  tailoredCoverLetterCount: 1,
  tailoredSpeechCount: 1,
  ...overrides,
});

describe('computeUserProgressState', () => {
  it('flags phase 1 when CV is missing', () => {
    const state = computeUserProgressState(baseInputs({ cvCount: 1, experiencesCount: 0 }));
    expect(state.phase).toBe('phase1');
    expect(state.phase1.isComplete).toBe(false);
    expect(state.phase1.missing).toContain('cvUploaded');
  });

  it('flags phase 1 when experiences are missing', () => {
    const state = computeUserProgressState(baseInputs({ experiencesCount: 1 }));
    expect(state.phase).toBe('phase1');
    expect(state.phase1.missing).toContain('experienceCount');
  });

  it('flags phase 2 when identity path is incomplete', () => {
    const state = computeUserProgressState(
      baseInputs({
        profile: {
          ...baseProfile,
          goals: [],
          aspirations: [],
          personalValues: [],
        } as ProgressInputs['profile'],
        storiesCount: 0,
      })
    );
    expect(state.phase).toBe('phase2');
    expect(state.phase2A.isComplete).toBe(false);
    expect(state.phase2B.isComplete).toBe(true);
  });

  it('flags phase 2 when job path is incomplete', () => {
    const state = computeUserProgressState(baseInputs({ jobsCount: 0, matchingSummaryCount: 0 }));
    expect(state.phase).toBe('phase2');
    expect(state.phase2B.isComplete).toBe(false);
  });

  it('flags phase 3 when tailored materials are missing', () => {
    const state = computeUserProgressState(baseInputs({ tailoredSpeechCount: 0 }));
    expect(state.phase).toBe('phase3');
    expect(state.phase3.isComplete).toBe(false);
    expect(state.phase3.missing).toContain('tailoredSpeech');
  });

  it('returns bonus phase when all phases are complete', () => {
    const state = computeUserProgressState(baseInputs());
    expect(state.phase).toBe('bonus');
    expect(state.phase3.isComplete).toBe(true);
  });
});
