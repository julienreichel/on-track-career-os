import type { UserProfile } from '@/domain/user-profile/UserProfile';

export type ProgressPhase = 'phase1' | 'phase2' | 'phase3' | 'bonus';

export type ProgressGate =
  | 'cvUploaded'
  | 'experienceCount'
  | 'profileBasics'
  | 'profileDepth'
  | 'stories'
  | 'personalCanvas'
  | 'jobUploaded'
  | 'matchingSummary'
  | 'tailoredCv'
  | 'tailoredCoverLetter'
  | 'tailoredSpeech';

export type ProgressCheckResult = {
  isComplete: boolean;
  missing: ProgressGate[];
};

export type UserProgressState = {
  phase: ProgressPhase;
  phase1: ProgressCheckResult;
  phase2B: ProgressCheckResult;
  phase2A: ProgressCheckResult;
  phase3: ProgressCheckResult;
};

export type ProgressInputs = {
  profile: UserProfile | null;
  cvCount: number;
  experiencesCount: number;
  storiesCount: number;
  personalCanvasCount: number;
  jobsCount: number;
  matchingSummaryCount: number;
  tailoredCvCount: number;
  tailoredCoverLetterCount: number;
  tailoredSpeechCount: number;
};

export type NextActionItem = {
  id: string;
  labelKey: string;
  rationaleKey: string;
  to: string;
  disabled?: boolean;
};

export type NextAction = {
  phase: ProgressPhase;
  primary: NextActionItem;
  missingPrerequisites: ProgressGate[];
};

export type FeatureUnlocks = {
  phase2Enabled: boolean;
  phase3Enabled: boolean;
  bonusEnabled: boolean;
};
