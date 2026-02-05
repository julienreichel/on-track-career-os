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

function computePhase3(input: ProgressInputs): ProgressCheckResult {
  const profileDepthComplete = hasProfileDepth(input.profile);
  const hasStories = input.storyCount > 0;
  const hasCanvas = input.personalCanvasCount > 0;

  const phase2Missing: ProgressGate[] = [];
  if (!profileDepthComplete) {
    phase2Missing.push('profileDepth');
  }
  if (!hasStories) {
    phase2Missing.push('stories');
  }
  if (!hasCanvas) {
    phase2Missing.push('personalCanvas');
  }

  return buildCheck(phase2Missing);
}

function computePhase2(input: ProgressInputs): ProgressCheckResult {
  const hasJobs = input.jobCount > 0;
  const hasMatchingSummary = input.matchingSummaryCount > 0;

  const phase3Missing: ProgressGate[] = [];
  if (!hasJobs) {
    phase3Missing.push('jobUploaded');
  }
  if (!hasMatchingSummary) {
    phase3Missing.push('matchingSummary');
  }

  return buildCheck(phase3Missing);
}

function computePhase4(input: ProgressInputs): ProgressCheckResult {
  const hasTailoredCv = input.tailoredCvCount > 0;
  const hasTailoredCoverLetter = input.tailoredCoverLetterCount > 0;
  const hasTailoredSpeech = input.tailoredSpeechCount > 0;

  const phase4Missing: ProgressGate[] = [];
  if (!hasTailoredCv) {
    phase4Missing.push('tailoredCv');
  }
  if (!hasTailoredCoverLetter) {
    phase4Missing.push('tailoredCoverLetter');
  }
  if (!hasTailoredSpeech) {
    phase4Missing.push('tailoredSpeech');
  }

  return buildCheck(phase4Missing);
}

function resolvePhase(
  phase1: ProgressCheckResult,
  phase2: ProgressCheckResult,
  phase3: ProgressCheckResult,
  phase4: ProgressCheckResult
): UserProgressState['phase'] {
  if (!phase1.isComplete) {
    return 'phase1';
  }
  if (!phase2.isComplete) {
    return 'phase2';
  }
  if (!phase3.isComplete) {
    return 'phase3';
  }
  if (!phase4.isComplete) {
    return 'phase4';
  }
  return 'bonus';
}

export function computeUserProgressState(input: ProgressInputs): UserProgressState {
  const phase1 = computePhase1(input);
  const phase2 = computePhase3(input);
  const phase3 = computePhase2(input);
  const phase4 = computePhase4(input);
  const phase = resolvePhase(phase1, phase2, phase3, phase4);

  return {
    phase,
    phase1,
    phase2,
    phase3,
    phase4,
  };
}
