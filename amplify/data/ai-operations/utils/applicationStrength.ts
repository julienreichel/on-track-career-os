export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const MIN_IMPROVEMENTS = 2;
export const MAX_BULLET_LENGTH = 160;
export const PREFERRED_IMPROVEMENTS = 3;

export type ApplicationImprovement = {
  title: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  target: {
    document: 'cv' | 'coverLetter';
    anchor: string;
  };
};

const DEFAULT_IMPROVEMENTS: ApplicationImprovement[] = [
  {
    title: 'Clarify professional summary',
    action: 'Add a focused 2-3 line summary aligned to this role and include core required skills.',
    impact: 'high',
    target: { document: 'cv', anchor: 'summary' },
  },
  {
    title: 'Strengthen skills alignment',
    action: 'Prioritize role-relevant skills and tools in a dedicated skills section using job terminology.',
    impact: 'high',
    target: { document: 'cv', anchor: 'skills' },
  },
  {
    title: 'Add measurable evidence',
    action:
      'Rewrite recent experience bullets with measurable outcomes to prove impact and ownership for this role.',
    impact: 'medium',
    target: { document: 'cv', anchor: 'experience' },
  },
];

export function clampScore(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return SCORE_MIN;
  }
  const rounded = Math.round(numeric);
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, rounded));
}

export function truncateBullet(value: unknown, maxLength: number = MAX_BULLET_LENGTH): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return normalized.slice(0, maxLength).trimEnd();
}

export function ensureMinImprovements(
  improvements: ApplicationImprovement[],
  options: { hasCoverLetter: boolean; min?: number } = { hasCoverLetter: false }
): ApplicationImprovement[] {
  const min = options.min ?? MIN_IMPROVEMENTS;
  const normalized = [...improvements];

  if (!options.hasCoverLetter) {
    for (const item of normalized) {
      item.target.document = 'cv';
      if (!item.target.anchor) {
        item.target.anchor = 'general';
      }
    }
  }

  for (const fallback of DEFAULT_IMPROVEMENTS) {
    if (normalized.length >= min) {
      break;
    }

    const alreadyExists = normalized.some(
      (item) => item.target.document === fallback.target.document && item.target.anchor === fallback.target.anchor
    );

    if (!alreadyExists) {
      normalized.push({
        ...fallback,
        target: {
          ...fallback.target,
          document: options.hasCoverLetter ? fallback.target.document : 'cv',
        },
      });
    }
  }

  return normalized.slice(0, Math.max(min, PREFERRED_IMPROVEMENTS));
}
