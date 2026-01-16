import type { ProgressCheckResult, ProgressGate, ProgressInputs, UserProgressState } from './types';

function buildCheck(missing: ProgressGate[], reasonKeys: string[]): ProgressCheckResult {
  return {
    isComplete: missing.length === 0,
    missing,
    reasonKeys,
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
  const goals = profile?.goals ?? [];
  const aspirations = profile?.aspirations ?? [];
  const personalValues = profile?.personalValues ?? [];
  return goals.length > 0 && aspirations.length > 0 && personalValues.length > 0;
}

function computePhase1(input: ProgressInputs): ProgressCheckResult {
  const cvUploaded = input.experiencesCount > 0;
  const hasExperiences = input.experiencesCount >= MIN_EXPERIENCE_COUNT;
  const basicsComplete =
    Boolean(input.profile?.fullName?.trim()) &&
    hasContactInfo(input.profile) &&
    Boolean(input.profile?.workPermitInfo?.trim()) &&
    (input.profile?.socialLinks ?? []).length > 0 &&
    hasProfessionalAttributes(input.profile);

  const phase1Missing: ProgressGate[] = [];
  const phase1Reasons: string[] = [];
  if (!cvUploaded) {
    phase1Missing.push('cvUploaded');
    phase1Reasons.push('progress.gates.cvUploaded');
  }
  if (!hasExperiences) {
    phase1Missing.push('experienceCount');
    phase1Reasons.push('progress.gates.experienceCount');
  }
  if (!basicsComplete) {
    phase1Missing.push('profileBasics');
    phase1Reasons.push('progress.gates.profileBasics');
  }

  return buildCheck(phase1Missing, phase1Reasons);
}

function computePhase2A(input: ProgressInputs): ProgressCheckResult {
  const profileDepthComplete = hasProfileDepth(input.profile);
  const hasStories = input.storiesCount > 0;
  const hasCanvas = input.personalCanvasCount > 0;

  const phase2BMissing: ProgressGate[] = [];
  const phase2BReasons: string[] = [];
  if (!profileDepthComplete) {
    phase2BMissing.push('profileDepth');
    phase2BReasons.push('progress.gates.profileDepth');
  }
  if (!hasStories) {
    phase2BMissing.push('stories');
    phase2BReasons.push('progress.gates.stories');
  }
  if (!hasCanvas) {
    phase2BMissing.push('personalCanvas');
    phase2BReasons.push('progress.gates.personalCanvas');
  }

  return buildCheck(phase2BMissing, phase2BReasons);
}

function computePhase2B(input: ProgressInputs): ProgressCheckResult {
  const hasJobs = input.jobsCount > 0;
  const hasMatchingSummary = input.matchingSummaryCount > 0;

  const phase2AMissing: ProgressGate[] = [];
  const phase2AReasons: string[] = [];
  if (!hasJobs) {
    phase2AMissing.push('jobUploaded');
    phase2AReasons.push('progress.gates.jobUploaded');
  }
  if (!hasMatchingSummary) {
    phase2AMissing.push('matchingSummary');
    phase2AReasons.push('progress.gates.matchingSummary');
  }

  return buildCheck(phase2AMissing, phase2AReasons);
}

function computePhase3(input: ProgressInputs): ProgressCheckResult {
  const hasTailoredCv = input.tailoredCvCount > 0;
  const hasTailoredCoverLetter = input.tailoredCoverLetterCount > 0;
  const hasTailoredSpeech = input.tailoredSpeechCount > 0;

  const phase3Missing: ProgressGate[] = [];
  const phase3Reasons: string[] = [];
  if (!hasTailoredCv) {
    phase3Missing.push('tailoredCv');
    phase3Reasons.push('progress.gates.tailoredCv');
  }
  if (!hasTailoredCoverLetter) {
    phase3Missing.push('tailoredCoverLetter');
    phase3Reasons.push('progress.gates.tailoredCoverLetter');
  }
  if (!hasTailoredSpeech) {
    phase3Missing.push('tailoredSpeech');
    phase3Reasons.push('progress.gates.tailoredSpeech');
  }

  return buildCheck(phase3Missing, phase3Reasons);
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
