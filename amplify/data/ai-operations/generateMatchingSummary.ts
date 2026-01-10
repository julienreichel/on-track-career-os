import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You are a skeptical talent-matching analyst evaluating job-candidate fit.

CRITICAL RULES:
1. Be honest and critical - do NOT assume a good match
2. Ground EVERY statement in the provided JSON data
3. NEVER invent companies, skills, experiences, or metrics
4. Use ONLY information explicitly present in the input
5. Respond with ONLY valid JSON matching the exact schema
6. If data is missing, reflect that in your assessment

SCORING PHILOSOPHY:
- Be conservative with scores - most candidates are not perfect matches
- scoreBreakdown components must sum to overallScore
- Skills are weighted heavily (max 50 points)
- Experience depth matters (max 30 points)  
- Interest alignment is a bonus (max 10 points)
- Unique edge/differentiators (max 10 points)

RECOMMENDATION LOGIC:
- If many required skills are missing => recommendation MUST be "skip" or "maybe" (not "apply")
- "apply" only if strong skill match + relevant experience + minimal risk
- "maybe" if some gaps but addressable
- "skip" if fundamental misalignment or too many critical missing skills`;

const OUTPUT_SCHEMA = `{
  "overallScore": <number 0-100>,
  "scoreBreakdown": {
    "skillFit": <number 0-50>,
    "experienceFit": <number 0-30>,
    "interestFit": <number 0-10>,
    "edge": <number 0-10>
  },
  "recommendation": "apply" | "maybe" | "skip",
  "reasoningHighlights": ["3-6 concise bullets explaining the overall assessment"],
  "strengthsForThisRole": ["3-6 specific strengths relevant to this position"],
  "skillMatch": [
    "6-12 items, each MUST start with [MATCH] | [PARTIAL] | [MISSING] | [OVER]",
    "[MATCH] Skill name — evidence from user data",
    "[PARTIAL] Skill name — what's present; what's missing",
    "[MISSING] Skill name — not present; suggest learning path",
    "[OVER] Skill name — exceeds requirement; position as differentiator"
  ],
  "riskyPoints": [
    "3-6 items in format: Risk: <specific concern>. Mitigation: <actionable suggestion>."
  ],
  "impactOpportunities": ["3-6 bullets where user can create value quickly"],
  "tailoringTips": ["3-6 actionable suggestions for application materials"]
}`;

const PROMPT_INDENT_SPACES = 2;

export interface MatchingExperienceSignal {
  title: string;
  companyName: string;
  startDate?: string;
  endDate?: string;
  experienceType: string;
  responsibilities: string[];
  tasks: string[];
  achievements?: string[];
  kpiSuggestions?: string[];
}

export interface MatchingUserProfile {
  fullName: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  workPermitInfo?: string;
  goals?: string[];
  aspirations?: string[];
  personalValues?: string[];
  strengths?: string[];
  interests?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: string[];
}

export interface MatchingPersonalCanvas {
  customerSegments?: string[];
  valueProposition?: string[];
  channels?: string[];
  customerRelationships?: string[];
  keyActivities?: string[];
  keyResources?: string[];
  keyPartners?: string[];
  costStructure?: string[];
  revenueStreams?: string[];
}

export interface MatchingJobDescription {
  title: string;
  seniorityLevel: string;
  roleSummary: string;
  responsibilities: string[];
  requiredSkills: string[];
  behaviours: string[];
  successCriteria: string[];
  explicitPains: string[];
}

export interface MatchingCompany {
  companyName: string;
  industry: string;
  sizeRange: string;
  website: string;
  description: string;
  productsServices: string[];
  targetMarkets: string[];
  customerSegments: string[];
  rawNotes: string;
}

export interface MatchingSpeechStory {
  experienceId?: string;
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  achievements?: string[];
}

export interface GenerateMatchingSummaryInput {
  profile: MatchingUserProfile;
  experiences?: MatchingExperienceSignal[];
  stories?: MatchingSpeechStory[];
  personalCanvas?: MatchingPersonalCanvas;
  jobDescription?: MatchingJobDescription;
  company?: MatchingCompany;
}

export interface GenerateMatchingSummaryOutput {
  overallScore: number;
  scoreBreakdown: {
    skillFit: number;
    experienceFit: number;
    interestFit: number;
    edge: number;
  };
  recommendation: 'apply' | 'maybe' | 'skip';
  reasoningHighlights: string[];
  strengthsForThisRole: string[];
  skillMatch: string[];
  riskyPoints: string[];
  impactOpportunities: string[];
  tailoringTips: string[];
  generatedAt: string;
  needsUpdate: boolean;
}

type ModelResponse = Partial<Omit<GenerateMatchingSummaryOutput, 'generatedAt' | 'needsUpdate'>>;

// Scoring constants
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const SKILL_FIT_MAX = 50;
const EXPERIENCE_FIT_MAX = 30;
const INTEREST_FIT_MAX = 10;
const EDGE_MAX = 10;

// Array length constraints
const REASONING_MIN = 3;
const REASONING_MAX = 6;
const STRENGTHS_MIN = 3;
const STRENGTHS_MAX = 6;
const SKILL_MATCH_MIN = 6;
const SKILL_MATCH_MAX = 12;
const RISKY_MIN = 3;
const RISKY_MAX = 6;
const IMPACT_MIN = 3;
const IMPACT_MAX = 6;
const TAILORING_MIN = 3;
const TAILORING_MAX = 6;

// Thresholds for guardrails
const MISSING_RATIO_SKIP = 0.55;
const MISSING_RATIO_MAYBE = 0.4;
const MISSING_RATIO_APPLY = 0.2;
const SKILL_FIT_CAP_SKIP = 20;
const SKILL_FIT_CAP_MAYBE = 25;
const SKILL_FIT_MIN_APPLY = 35;

// Skill match tag patterns
const SKILL_TAG_REGEX = /^\[(MATCH|PARTIAL|MISSING|OVER)\]/;
const RISKY_POINT_REGEX = /^Risk:.*Mitigation:/i;

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeScore(value: unknown, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return clamp(Math.round(value), SCORE_MIN, max);
}

function sanitizeArray(value: unknown, min: number, max: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const list: string[] = [];

  for (const entry of value) {
    const text = sanitizeString(entry);
    if (text && !seen.has(text)) {
      seen.add(text);
      list.push(text);
    }
  }

  // Trim to max length
  const trimmed = list.slice(0, max);

  // Pad to min if needed (avoid inventing data - use neutral placeholders only if critical)
  while (trimmed.length < min && trimmed.length < list.length) {
    const nextItem = list[trimmed.length];
    if (nextItem) trimmed.push(nextItem);
  }

  return trimmed;
}

function validateSkillMatchFormat(items: string[]): string[] {
  return items.filter((item) => SKILL_TAG_REGEX.test(item));
}

function validateRiskyPointsFormat(items: string[]): string[] {
  return items.filter((item) => RISKY_POINT_REGEX.test(item));
}

function countMissingSkills(skillMatch: string[]): {
  missing: number;
  total: number;
  ratio: number;
} {
  const missing = skillMatch.filter((item) => item.startsWith('[MISSING]')).length;
  const total = skillMatch.length;
  const ratio = total > 0 ? missing / total : 0;
  return { missing, total, ratio };
}

function applyRecommendationGuardrails(
  recommendation: string,
  skillMatch: string[],
  skillFit: number
): { recommendation: 'apply' | 'maybe' | 'skip'; skillFit: number } {
  const validRecommendations: Array<'apply' | 'maybe' | 'skip'> = ['apply', 'maybe', 'skip'];
  let finalRecommendation = validRecommendations.includes(
    recommendation as 'apply' | 'maybe' | 'skip'
  )
    ? (recommendation as 'apply' | 'maybe' | 'skip')
    : 'maybe';

  const { ratio: missingRatio } = countMissingSkills(skillMatch);
  let cappedSkillFit = skillFit;

  // Guardrail: High missing ratio must limit recommendation and skill score
  if (missingRatio > MISSING_RATIO_SKIP) {
    finalRecommendation = 'skip';
    cappedSkillFit = Math.min(cappedSkillFit, SKILL_FIT_CAP_SKIP);
  } else if (missingRatio > MISSING_RATIO_MAYBE) {
    if (finalRecommendation === 'apply') {
      finalRecommendation = 'maybe';
    }
    cappedSkillFit = Math.min(cappedSkillFit, SKILL_FIT_CAP_MAYBE);
  } else if (missingRatio <= MISSING_RATIO_APPLY && skillFit >= SKILL_FIT_MIN_APPLY) {
    // Strong match - can be "apply" if LLM suggested it
    // (no override needed, keep LLM's assessment)
  }

  return { recommendation: finalRecommendation, skillFit: cappedSkillFit };
}

function finalizeOutput(
  raw: ModelResponse,
  { fallback }: { fallback: boolean }
): GenerateMatchingSummaryOutput {
  const now = new Date().toISOString();

  // Sanitize scores
  let skillFit = sanitizeScore(raw.scoreBreakdown?.skillFit, SKILL_FIT_MAX);
  const experienceFit = sanitizeScore(raw.scoreBreakdown?.experienceFit, EXPERIENCE_FIT_MAX);
  const interestFit = sanitizeScore(raw.scoreBreakdown?.interestFit, INTEREST_FIT_MAX);
  const edge = sanitizeScore(raw.scoreBreakdown?.edge, EDGE_MAX);

  // Sanitize arrays
  const reasoningHighlights = sanitizeArray(raw.reasoningHighlights, REASONING_MIN, REASONING_MAX);
  const strengthsForThisRole = sanitizeArray(
    raw.strengthsForThisRole,
    STRENGTHS_MIN,
    STRENGTHS_MAX
  );

  let skillMatch = sanitizeArray(raw.skillMatch, SKILL_MATCH_MIN, SKILL_MATCH_MAX);
  skillMatch = validateSkillMatchFormat(skillMatch);
  if (skillMatch.length < SKILL_MATCH_MIN) {
    // Pad with neutral [MISSING] items if format validation removed too many
    while (skillMatch.length < SKILL_MATCH_MIN) {
      skillMatch.push('[MISSING] Additional skill analysis needed');
    }
  }

  let riskyPoints = sanitizeArray(raw.riskyPoints, RISKY_MIN, RISKY_MAX);
  riskyPoints = validateRiskyPointsFormat(riskyPoints);
  if (riskyPoints.length < RISKY_MIN) {
    // Pad with neutral risk/mitigation if needed
    while (riskyPoints.length < RISKY_MIN) {
      riskyPoints.push(
        'Risk: Limited data for full assessment. Mitigation: Review all requirements carefully.'
      );
    }
  }

  const impactOpportunities = sanitizeArray(raw.impactOpportunities, IMPACT_MIN, IMPACT_MAX);
  const tailoringTips = sanitizeArray(raw.tailoringTips, TAILORING_MIN, TAILORING_MAX);

  // Apply recommendation guardrails
  const { recommendation, skillFit: cappedSkillFit } = applyRecommendationGuardrails(
    raw.recommendation || 'maybe',
    skillMatch,
    skillFit
  );

  // Update skill fit if capped
  skillFit = cappedSkillFit;
  const finalOverallScore = clamp(
    skillFit + experienceFit + interestFit + edge,
    SCORE_MIN,
    SCORE_MAX
  );

  return {
    overallScore: finalOverallScore,
    scoreBreakdown: {
      skillFit,
      experienceFit,
      interestFit,
      edge,
    },
    recommendation,
    reasoningHighlights,
    strengthsForThisRole,
    skillMatch,
    riskyPoints,
    impactOpportunities,
    tailoringTips,
    generatedAt: now,
    needsUpdate: fallback,
  };
}

function buildFallbackOutput(): GenerateMatchingSummaryOutput {
  return {
    overallScore: 0,
    scoreBreakdown: {
      skillFit: 0,
      experienceFit: 0,
      interestFit: 0,
      edge: 0,
    },
    recommendation: 'skip',
    reasoningHighlights: [
      'Unable to generate matching analysis',
      'Please verify input data completeness',
      'Consider retrying after reviewing profile and job details',
    ],
    strengthsForThisRole: [
      'Analysis unavailable',
      'Please retry generation',
      'Ensure profile is complete',
    ],
    skillMatch: [
      '[MISSING] Analysis failed - unable to assess skills',
      '[MISSING] Retry matching analysis',
      '[MISSING] Verify data completeness',
      '[MISSING] Review job requirements',
      '[MISSING] Update profile if needed',
      '[MISSING] Contact support if issue persists',
    ],
    riskyPoints: [
      'Risk: Analysis generation failed. Mitigation: Retry with verified data.',
      'Risk: Incomplete assessment. Mitigation: Review all input fields.',
      'Risk: Cannot determine fit. Mitigation: Manually review requirements.',
    ],
    impactOpportunities: ['Analysis unavailable', 'Please retry generation', 'Review manually'],
    tailoringTips: [
      'Complete profile data first',
      'Retry matching analysis',
      'Review job requirements manually',
    ],
    generatedAt: new Date().toISOString(),
    needsUpdate: true,
  };
}

function buildUserPrompt(args: GenerateMatchingSummaryInput) {
  const userSkills = args.profile.skills || [];
  const jobSkills = args.jobDescription?.requiredSkills || [];

  return `Analyze this job-candidate match with skepticism and honesty.

USER DATA:
${JSON.stringify(args, null, PROMPT_INDENT_SPACES)}

CRITICAL INSTRUCTIONS:
1. Compare user skills/experience against EVERY required skill in the job
2. For each job skill, determine: [MATCH], [PARTIAL], [MISSING], or [OVER]
3. Be honest about gaps - if critical skills are missing, recommendation cannot be "apply"
4. Score conservatively: most candidates are not 80+ matches
5. Ensure scoreBreakdown components sum to overallScore
6. If you identify many [MISSING] skills, recommendation MUST be "skip" or "maybe"
7. riskyPoints must follow format: "Risk: <issue>. Mitigation: <action>."
8. NEVER invent skills, companies, or experiences not in the input

Required job skills to evaluate: ${jobSkills.join(', ') || 'Review responsibilities'}
User claims these skills: ${userSkills.join(', ') || 'None specified'}

Return ONLY valid JSON matching this exact schema:
${OUTPUT_SCHEMA}`;
}

type HandlerEvent = {
  arguments: GenerateMatchingSummaryInput;
};

export const handler = async (event: HandlerEvent) => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  return withAiOperationHandlerObject(
    'generateMatchingSummary',
    { arguments: event.arguments },
    async (args) => {
      const userPrompt = buildUserPrompt(args);

      try {
        const response = await invokeAiWithRetry<ModelResponse>({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          outputSchema: OUTPUT_SCHEMA,
          validate: (raw) => finalizeOutput(raw ?? {}, { fallback: false }),
          operationName: 'generateMatchingSummary',
        });

        return response;
      } catch (error) {
        console.error('generateMatchingSummary fallback triggered', {
          reason: (error as Error).message,
        });
        return buildFallbackOutput();
      }
    },
    (args) => ({
      userName: args.profile?.fullName,
      jobTitle: args.jobDescription?.title,
      hasCompany: Boolean(args.company),
      experienceCount: args.experiences?.length ?? 0,
      jobSignalsPreview: truncateForLog(JSON.stringify(args.jobDescription)),
    })
  );
};
