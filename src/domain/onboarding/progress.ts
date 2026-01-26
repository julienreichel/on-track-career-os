import type { ProgressCheckResult, ProgressGate, ProgressInputs, UserProgressState } from './types';

function buildCheck(missing: ProgressGate[]): ProgressCheckResult {
  return {
    isComplete: missing.length === 0,
    missing,
  };
}

const MIN_EXPERIENCE_COUNT = 3;

function hasContactInfo(profile: ProgressInputs['profile']): boolean {
  return Boolean(profile?.primaryEmail?.trim() || profile?.primaryPhone?.trim());
}

function hasProfessionalAttributes(profile: ProgressInputs['profile']): boolean {
  const skills = profile?.skills ?? [];
  const languages = profile?.languages ?? [];
  return skills.length > 0 && languages.length > 0;
}

function hasProfileDepth(profile: ProgressInputs['profile']): boolean {
  const aspirations = profile?.aspirations ?? [];
  const personalValues = profile?.personalValues ?? [];
  const socialLinks = profile?.socialLinks ?? [];
  return socialLinks.length > 0 && aspirations.length > 0 && personalValues.length > 0;
}

function computePhase1(input: ProgressInputs): ProgressCheckResult {
  const cvUploaded = input.experienceCount > 0;
  const hasExperiences = input.experienceCount >= MIN_EXPERIENCE_COUNT;
  const basicsComplete =
    Boolean(input.profile?.fullName?.trim()) &&
    hasContactInfo(input.profile) &&
    hasProfessionalAttributes(input.profile);

  const phase1Missing: ProgressGate[] = [];
  if (!cvUploaded) {
    phase1Missing.push('cvUploaded');
  }
  if (!hasExperiences) {
    phase1Missing.push('experienceCount');
  }
  if (!basicsComplete) {
    phase1Missing.push('profileBasics');
  }

  return buildCheck(phase1Missing);
}

function computePhase2A(input: ProgressInputs): ProgressCheckResult {
  const profileDepthComplete = hasProfileDepth(input.profile);
  const hasStories = input.storyCount > 0;
  const hasCanvas = input.personalCanvasCount > 0;

  const phase2BMissing: ProgressGate[] = [];
  if (!profileDepthComplete) {
    phase2BMissing.push('profileDepth');
  }
  if (!hasStories) {
    phase2BMissing.push('stories');
  }
  if (!hasCanvas) {
    phase2BMissing.push('personalCanvas');
  }

  return buildCheck(phase2BMissing);
}

function computePhase2B(input: ProgressInputs): ProgressCheckResult {
  const hasJobs = input.jobCount > 0;
  const hasMatchingSummary = input.matchingSummaryCount > 0;

  const phase2AMissing: ProgressGate[] = [];
  if (!hasJobs) {
    phase2AMissing.push('jobUploaded');
  }
  if (!hasMatchingSummary) {
    phase2AMissing.push('matchingSummary');
  }

  return buildCheck(phase2AMissing);
}

function computePhase3(input: ProgressInputs): ProgressCheckResult {
  const hasTailoredCv = input.tailoredCvCount > 0;
  const hasTailoredCoverLetter = input.tailoredCoverLetterCount > 0;
  const hasTailoredSpeech = input.tailoredSpeechCount > 0;

  const phase3Missing: ProgressGate[] = [];
  if (!hasTailoredCv) {
    phase3Missing.push('tailoredCv');
  }
  if (!hasTailoredCoverLetter) {
    phase3Missing.push('tailoredCoverLetter');
  }
  if (!hasTailoredSpeech) {
    phase3Missing.push('tailoredSpeech');
  }

  return buildCheck(phase3Missing);
}

function resolvePhase(
  phase1: ProgressCheckResult,
  phase2B: ProgressCheckResult,
  phase2A: ProgressCheckResult,
  phase3: ProgressCheckResult
): UserProgressState['phase'] {
  if (!phase1.isComplete) {
    return 'phase1';
  }
  if (!phase2B.isComplete || !phase2A.isComplete) {
    return 'phase2';
  }
  if (!phase3.isComplete) {
    return 'phase3';
  }
  return 'bonus';
}

export function computeUserProgressState(input: ProgressInputs): UserProgressState {
  const phase1 = computePhase1(input);
  const phase2B = computePhase2A(input);
  const phase2A = computePhase2B(input);
  const phase3 = computePhase3(input);
  const phase = resolvePhase(phase1, phase2B, phase2A, phase3);

  return {
    phase,
    phase1,
    phase2B,
    phase2A,
    phase3,
  };
}
