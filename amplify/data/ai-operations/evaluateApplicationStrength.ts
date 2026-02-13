import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';
import {
  clampScore,
  ensureMinImprovements,
  MAX_BULLET_LENGTH,
  MIN_IMPROVEMENTS,
  truncateBullet,
  type ApplicationImprovement,
} from './utils/applicationStrength';
import type { JobDescription } from './types/schema-types';

const SYSTEM_PROMPT = `You are an application evaluator. You assess how strong a candidate's application is for a specific job, using ONLY:
- the structured job description fields provided
- the CV text provided
- the optional cover letter text provided

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent facts about the candidate, company, or role.
- Do not claim the candidate has skills/experience unless the provided CV/letter text explicitly contains them.
- Do not add new achievements, numbers, employers, titles, or dates.
- Output MUST match the schema exactly: all keys must exist, correct types only.
- Use "" for unknown strings, [] for empty arrays. Never output null.
- Use concise, actionable bullets (each <= 160 characters).

SCORING RULES (0..100):
Provide dimension scores and an overallScore.
Scores must be justified by the provided texts:
- If evidence is missing, score lower and add missingSignals + improvements.
- If coverLetterText is missing, do not penalize letter-specific dimensions; adapt rationale accordingly.

EVALUATION DIMENSIONS:
1) atsReadiness: likelihood the document passes automated screening based on structure + keyword signals.
2) keywordCoverage: presence of job-required skills/terms reflected in the materials (exact or close synonyms).
3) clarityFocus: clarity, specificity, and low fluff; easy to scan; role-focused.
4) targetedFitSignals: tailoring to this role (title alignment, relevant highlights, role vocabulary, job pains addressed).
5) evidenceStrength: measurable outcomes, concrete impact, credible proof (metrics when present, otherwise specific outcomes).

DECISION GATE:
Return a decision label:
- "strong" (readyToApply = true)
- "borderline" (readyToApply = false)
- "risky" (readyToApply = false)
The decision must be consistent with overallScore and the weakest dimensions.

IMPROVEMENT ACTIONS:
Return at least 2 improvements. Prefer 3.
Each improvement must include:
- a short title
- an action instruction
- a target telling the UI where the user should edit (cv or cover letter) and an anchor section name when possible.
If you cannot infer a section, use target.anchor = "general".

MISSING SIGNALS:
List missing signals relevant to selection for interview (e.g., metrics, ownership, leadership, stakeholder mgmt, domain keywords),
but only if they are truly absent from the provided texts.`;

const OUTPUT_SCHEMA = `{
  "overallScore": [0-100],
  "dimensionScores": {
    "atsReadiness": [0-100],
    "keywordCoverage": [0-100],
    "clarityFocus": [0-100],
    "targetedFitSignals": [0-100],
    "evidenceStrength": [0-100]
  },
  "decision": {
    "label": "strong|borderline|risky",
    "readyToApply": true,
    "rationaleBullets": ["string"]
  },
  "missingSignals": ["string"],
  "topImprovements": [
    {
      "title": "string",
      "action": "string",
      "impact": "high|medium|low",
      "target": {
        "document": "cv|coverLetter",
        "anchor": "string"
      }
    }
  ],
  "notes": {
    "atsNotes": ["string"],
    "humanReaderNotes": ["string"]
  }
}`;

const RATIONALE_MIN = 2;
const RATIONALE_MAX = 5;
const ARRAY_MAX = 8;
const ANCHOR_MAX_LENGTH = 80;
const DECISION_STRONG_SCORE_MIN = 75;
const DECISION_STRONG_WEAKEST_MIN = 55;
const DECISION_BORDERLINE_SCORE_MIN = 50;
const DIMENSION_COUNT = 5;
const PROMPT_INDENT_SPACES = 2;

type DecisionLabel = 'strong' | 'borderline' | 'risky';
type Impact = 'high' | 'medium' | 'low';
type TargetDocument = 'cv' | 'coverLetter';

export interface EvaluateApplicationStrengthInput {
  job: JobDescription;
  cvText: string;
  coverLetterText: string;
  language: string;
}

export interface EvaluateApplicationStrengthOutput {
  overallScore: number;
  dimensionScores: {
    atsReadiness: number;
    keywordCoverage: number;
    clarityFocus: number;
    targetedFitSignals: number;
    evidenceStrength: number;
  };
  decision: {
    label: DecisionLabel;
    readyToApply: boolean;
    rationaleBullets: string[];
  };
  missingSignals: string[];
  topImprovements: ApplicationImprovement[];
  notes: {
    atsNotes: string[];
    humanReaderNotes: string[];
  };
}

type ModelResponse = Partial<EvaluateApplicationStrengthOutput>;

function sanitizeArray(value: unknown, max: number = ARRAY_MAX): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const out: string[] = [];
  for (const item of value) {
    const normalized = truncateBullet(item, MAX_BULLET_LENGTH);
    if (!normalized) continue;
    out.push(normalized);
    if (out.length >= max) {
      break;
    }
  }

  return out;
}

function sanitizeImpact(value: unknown): Impact {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function sanitizeDocument(value: unknown, hasCoverLetter: boolean): TargetDocument {
  if (value === 'coverLetter' && hasCoverLetter) {
    return 'coverLetter';
  }
  return 'cv';
}

function sanitizeAnchor(value: unknown): string {
  return truncateBullet(value, ANCHOR_MAX_LENGTH) || 'general';
}

function sanitizeImprovements(
  value: unknown,
  options: { hasCoverLetter: boolean }
): ApplicationImprovement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const improvements: ApplicationImprovement[] = [];

  for (const item of value) {
    const candidate = item as {
      title?: unknown;
      action?: unknown;
      impact?: unknown;
      target?: { document?: unknown; anchor?: unknown };
    };

    const title = truncateBullet(candidate?.title, MAX_BULLET_LENGTH);
    const action = truncateBullet(candidate?.action, MAX_BULLET_LENGTH);

    if (!title && !action) {
      continue;
    }

    improvements.push({
      title: title || 'Improve application quality',
      action:
        action || 'Refine wording to better match role requirements and add concrete evidence.',
      impact: sanitizeImpact(candidate?.impact),
      target: {
        document: sanitizeDocument(candidate?.target?.document, options.hasCoverLetter),
        anchor: sanitizeAnchor(candidate?.target?.anchor),
      },
    });
  }

  return improvements;
}

function ensureRationaleBullets(value: string[]): string[] {
  const trimmed = value.slice(0, RATIONALE_MAX);

  if (trimmed.length >= RATIONALE_MIN) {
    return trimmed;
  }

  const fallback = [
    'Keyword coverage and evidence depth are limiting current application strength.',
    'Targeted edits can improve clarity and role alignment before applying.',
  ];

  while (trimmed.length < RATIONALE_MIN) {
    trimmed.push(fallback[trimmed.length] || 'Refine key sections for stronger fit signals.');
  }

  return trimmed;
}

function deriveDecision(
  overallScore: number,
  weakestDimension: number
): {
  label: DecisionLabel;
  readyToApply: boolean;
} {
  if (
    overallScore >= DECISION_STRONG_SCORE_MIN &&
    weakestDimension >= DECISION_STRONG_WEAKEST_MIN
  ) {
    return { label: 'strong', readyToApply: true };
  }
  if (overallScore >= DECISION_BORDERLINE_SCORE_MIN) {
    return { label: 'borderline', readyToApply: false };
  }
  return { label: 'risky', readyToApply: false };
}

function finalizeOutput(
  raw: ModelResponse,
  options: { hasCoverLetter: boolean }
): EvaluateApplicationStrengthOutput {
  const dimensionScores = {
    atsReadiness: clampScore(raw.dimensionScores?.atsReadiness),
    keywordCoverage: clampScore(raw.dimensionScores?.keywordCoverage),
    clarityFocus: clampScore(raw.dimensionScores?.clarityFocus),
    targetedFitSignals: clampScore(raw.dimensionScores?.targetedFitSignals),
    evidenceStrength: clampScore(raw.dimensionScores?.evidenceStrength),
  };

  const weakestDimension = Math.min(
    dimensionScores.atsReadiness,
    dimensionScores.keywordCoverage,
    dimensionScores.clarityFocus,
    dimensionScores.targetedFitSignals,
    dimensionScores.evidenceStrength
  );

  const averageDimensionScore = Math.round(
    (dimensionScores.atsReadiness +
      dimensionScores.keywordCoverage +
      dimensionScores.clarityFocus +
      dimensionScores.targetedFitSignals +
      dimensionScores.evidenceStrength) /
      DIMENSION_COUNT
  );

  const overallScore = clampScore(raw.overallScore ?? averageDimensionScore);
  const derivedDecision = deriveDecision(overallScore, weakestDimension);

  const rationaleBullets = ensureRationaleBullets(
    sanitizeArray(raw.decision?.rationaleBullets, RATIONALE_MAX)
  );

  const label: DecisionLabel = derivedDecision.label;
  const readyToApply = derivedDecision.readyToApply;

  const topImprovements = ensureMinImprovements(
    sanitizeImprovements(raw.topImprovements, options),
    {
      hasCoverLetter: options.hasCoverLetter,
      min: MIN_IMPROVEMENTS,
    }
  );

  return {
    overallScore,
    dimensionScores,
    decision: {
      label,
      readyToApply,
      rationaleBullets,
    },
    missingSignals: sanitizeArray(raw.missingSignals),
    topImprovements,
    notes: {
      atsNotes: sanitizeArray(raw.notes?.atsNotes),
      humanReaderNotes: sanitizeArray(raw.notes?.humanReaderNotes),
    },
  };
}

function buildUserPrompt(input: EvaluateApplicationStrengthInput): string {
  const jobJson = JSON.stringify(input.job, null, PROMPT_INDENT_SPACES);

  return `Evaluate the strength of this application for the given job.

Job (structured):
${jobJson}

CV text:
${input.cvText}

Cover letter text (optional; may be empty string):
${input.coverLetterText}

Output language: ${input.language}

Return a JSON object with this exact structure:
${OUTPUT_SCHEMA}

Important:
- Use only explicit evidence from the provided CV/cover letter text.
- If coverLetterText is empty: set document targets to "cv" and avoid letter-only criticism.
- rationaleBullets: 2 to 5 bullets, concise.
- topImprovements: at least 2 items, preferably 3.
- anchor should be a common section label when possible (e.g., "summary", "skills", "experience", "education", "projects", "coverLetterBody", "general").
- Never output null.
- Keep output text in the requested language.`;
}

function buildFallbackOutput(hasCoverLetter: boolean): EvaluateApplicationStrengthOutput {
  return finalizeOutput(
    {
      overallScore: 0,
      dimensionScores: {
        atsReadiness: 0,
        keywordCoverage: 0,
        clarityFocus: 0,
        targetedFitSignals: 0,
        evidenceStrength: 0,
      },
      decision: {
        label: 'risky',
        readyToApply: false,
        rationaleBullets: [
          'Evaluation failed due to unstable model output.',
          'Retry after reviewing CV and job data completeness.',
        ],
      },
      missingSignals: ['Insufficient reliable output to assess missing signals.'],
      topImprovements: [],
      notes: {
        atsNotes: ['Fallback response used after validation failure.'],
        humanReaderNotes: ['Run evaluation again to get role-specific recommendations.'],
      },
    },
    { hasCoverLetter }
  );
}

type HandlerEvent = {
  arguments: EvaluateApplicationStrengthInput;
};

export const handler = async (event: HandlerEvent): Promise<EvaluateApplicationStrengthOutput> => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  return withAiOperationHandlerObject(
    'evaluateApplicationStrength',
    { arguments: event.arguments },
    async (args) => {
      const hasCoverLetter = args.coverLetterText.trim().length > 0;
      const userPrompt = buildUserPrompt(args);

      try {
        return await invokeAiWithRetry<EvaluateApplicationStrengthOutput>({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          outputSchema: OUTPUT_SCHEMA,
          validate: (raw) => finalizeOutput(raw ?? {}, { hasCoverLetter }),
          operationName: 'evaluateApplicationStrength',
        });
      } catch (error) {
        console.error('evaluateApplicationStrength fallback triggered', {
          reason: (error as Error).message,
        });
        return buildFallbackOutput(hasCoverLetter);
      }
    },
    (args) => ({
      jobTitle: args.job?.title,
      language: args.language,
      cvPreview: truncateForLog(args.cvText),
      hasCoverLetter: Boolean(args.coverLetterText.trim()),
    })
  );
};
