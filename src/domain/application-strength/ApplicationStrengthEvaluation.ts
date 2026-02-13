import type { EvaluateApplicationStrengthInput } from '@/domain/ai-operations/ApplicationStrengthResult';

export const CV_ANCHORS = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'general',
] as const;

export const COVER_LETTER_ANCHORS = ['coverLetterBody', 'opening', 'closing', 'general'] as const;

export type CvAnchorId = (typeof CV_ANCHORS)[number];
export type CoverLetterAnchorId = (typeof COVER_LETTER_ANCHORS)[number];
export type AnchorId = CvAnchorId | CoverLetterAnchorId;

export type ImprovementTarget = {
  document: 'cv' | 'coverLetter';
  anchor: AnchorId;
};

export type ApplicationStrengthImprovement = {
  title: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  target: ImprovementTarget;
};

export type ApplicationStrengthEvaluation = {
  overallScore: number;
  dimensionScores: {
    atsReadiness: number;
    keywordCoverage: number;
    clarityFocus: number;
    targetedFitSignals: number;
    evidenceStrength: number;
  };
  decision: {
    label: 'strong' | 'borderline' | 'risky';
    readyToApply: boolean;
    rationaleBullets: string[];
  };
  missingSignals: string[];
  topImprovements: ApplicationStrengthImprovement[];
  notes: {
    atsNotes: string[];
    humanReaderNotes: string[];
  };
};

export type ApplicationStrengthEvaluationInput = EvaluateApplicationStrengthInput;

const SCORE_MIN = 0;
const SCORE_MAX = 100;
const DEFAULT_BULLET = '';

const NORMALIZED_ANCHOR_MAP: Record<string, AnchorId> = {
  summary: 'summary',
  profile: 'summary',
  resumeSummary: 'summary',
  skills: 'skills',
  competencies: 'skills',
  experience: 'experience',
  workExperience: 'experience',
  education: 'education',
  projects: 'projects',
  project: 'projects',
  coverLetterBody: 'coverLetterBody',
  body: 'coverLetterBody',
  opening: 'opening',
  intro: 'opening',
  closing: 'closing',
  conclusion: 'closing',
  general: 'general',
};

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toTrimmedString(item))
    .filter((item) => Boolean(item));
}

function toImpact(value: unknown): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'low' ? value : 'medium';
}

function toDocument(value: unknown): 'cv' | 'coverLetter' {
  return value === 'coverLetter' ? 'coverLetter' : 'cv';
}

function clampScore(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return SCORE_MIN;
  }

  const rounded = Math.round(numeric);
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, rounded));
}

export function normalizeAnchor(anchor: string): AnchorId {
  const key = toTrimmedString(anchor);
  if (!key) {
    return 'general';
  }

  return NORMALIZED_ANCHOR_MAP[key] ?? 'general';
}

export function isAnchorSupported(anchor: string): boolean {
  const key = toTrimmedString(anchor);
  if (!key) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(NORMALIZED_ANCHOR_MAP, key);
}

export function defaultAnchorForImprovementType(
  input: Pick<ApplicationStrengthImprovement, 'title' | 'action' | 'target'>
): AnchorId {
  const document = toDocument(input.target.document);
  const content = `${toTrimmedString(input.title)} ${toTrimmedString(input.action)}`.toLowerCase();

  if (document === 'coverLetter') {
    if (content.includes('opening') || content.includes('intro')) {
      return 'opening';
    }
    if (content.includes('closing') || content.includes('conclusion')) {
      return 'closing';
    }
    return 'coverLetterBody';
  }

  if (content.includes('summary') || content.includes('headline')) {
    return 'summary';
  }
  if (content.includes('skill')) {
    return 'skills';
  }
  if (content.includes('educat')) {
    return 'education';
  }
  if (content.includes('project')) {
    return 'projects';
  }
  if (content.includes('experien') || content.includes('achievement')) {
    return 'experience';
  }

  return 'general';
}

export function normalizeImprovementTarget(target: unknown): ImprovementTarget {
  const candidate = (target ?? {}) as { document?: unknown; anchor?: unknown };
  const document = toDocument(candidate.document);

  const normalizedAnchor = normalizeAnchor(toTrimmedString(candidate.anchor));
  const cvAnchors = new Set<AnchorId>(CV_ANCHORS);
  const coverLetterAnchors = new Set<AnchorId>(COVER_LETTER_ANCHORS);

  if (document === 'cv') {
    return {
      document,
      anchor: cvAnchors.has(normalizedAnchor) ? normalizedAnchor : 'general',
    };
  }

  return {
    document,
    anchor: coverLetterAnchors.has(normalizedAnchor) ? normalizedAnchor : 'general',
  };
}

function normalizeImprovement(value: unknown): ApplicationStrengthImprovement {
  const candidate = (value ?? {}) as {
    title?: unknown;
    action?: unknown;
    impact?: unknown;
    target?: unknown;
  };

  return {
    title: toTrimmedString(candidate.title),
    action: toTrimmedString(candidate.action),
    impact: toImpact(candidate.impact),
    target: normalizeImprovementTarget(candidate.target),
  };
}

function normalizeDecision(
  value: Partial<ApplicationStrengthEvaluation['decision']> | undefined
): ApplicationStrengthEvaluation['decision'] {
  const label =
    value?.label === 'strong' || value?.label === 'borderline' || value?.label === 'risky'
      ? value.label
      : 'risky';

  return {
    label,
    readyToApply: Boolean(value?.readyToApply),
    rationaleBullets: toStringArray(value?.rationaleBullets),
  };
}

function normalizeDimensionScores(
  value: Partial<ApplicationStrengthEvaluation['dimensionScores']> | undefined
): ApplicationStrengthEvaluation['dimensionScores'] {
  return {
    atsReadiness: clampScore(value?.atsReadiness),
    keywordCoverage: clampScore(value?.keywordCoverage),
    clarityFocus: clampScore(value?.clarityFocus),
    targetedFitSignals: clampScore(value?.targetedFitSignals),
    evidenceStrength: clampScore(value?.evidenceStrength),
  };
}

function normalizeNotes(
  value: Partial<ApplicationStrengthEvaluation['notes']> | undefined
): ApplicationStrengthEvaluation['notes'] {
  return {
    atsNotes: toStringArray(value?.atsNotes),
    humanReaderNotes: toStringArray(value?.humanReaderNotes),
  };
}

function normalizeImprovements(value: unknown): ApplicationStrengthImprovement[] {
  return Array.isArray(value) ? value.map((item) => normalizeImprovement(item)) : [];
}

export function normalizeEvaluationDto(value: unknown): ApplicationStrengthEvaluation {
  const candidate = (value ?? {}) as Partial<ApplicationStrengthEvaluation>;

  return {
    overallScore: clampScore(candidate.overallScore),
    dimensionScores: normalizeDimensionScores(candidate.dimensionScores),
    decision: normalizeDecision(candidate.decision),
    missingSignals: toStringArray(candidate.missingSignals),
    topImprovements: normalizeImprovements(candidate.topImprovements),
    notes: normalizeNotes(candidate.notes),
  };
}

export function isApplicationStrengthEvaluation(value: unknown): value is ApplicationStrengthEvaluation {
  const candidate = value as ApplicationStrengthEvaluation;
  return Boolean(
    candidate &&
      typeof candidate === 'object' &&
      typeof candidate.overallScore === 'number' &&
      Array.isArray(candidate.missingSignals) &&
      Array.isArray(candidate.topImprovements) &&
      Array.isArray(candidate.notes?.atsNotes) &&
      Array.isArray(candidate.notes?.humanReaderNotes) &&
      Array.isArray(candidate.decision?.rationaleBullets)
  );
}

export const EMPTY_IMPROVEMENT: ApplicationStrengthImprovement = {
  title: DEFAULT_BULLET,
  action: DEFAULT_BULLET,
  impact: 'medium',
  target: {
    document: 'cv',
    anchor: 'general',
  },
};
