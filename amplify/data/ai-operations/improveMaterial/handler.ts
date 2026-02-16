import { invokeBedrock } from '../utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from '../utils/common';
import { formatAiInputContext } from '../utils/promptFormat';
import type { EvaluateApplicationStrengthOutput } from '../evaluateApplicationStrength';
import type {
  CompanyProfile,
  Experience,
  ImproveMaterialInstructions,
  JobDescription,
  MatchingSummaryContext,
  Profile,
  SpeechStory,
} from '../types/schema-types';

const MIN_MARKDOWN_LENGTH = 200;
const BOUNDARY_MARKERS = new Set(['"""', '---']);

export const IMPROVE_MATERIAL_ERROR_CODES = {
  INVALID_INPUT: 'ERR_IMPROVE_MATERIAL_INVALID_INPUT',
  INVALID_OUTPUT: 'ERR_IMPROVE_MATERIAL_INVALID_OUTPUT',
  RETRY_FAILED_FALLBACK: 'ERR_IMPROVE_MATERIAL_RETRY_FAILED_FALLBACK',
} as const;

export type ImproveMaterialErrorCode =
  (typeof IMPROVE_MATERIAL_ERROR_CODES)[keyof typeof IMPROVE_MATERIAL_ERROR_CODES];

type MaterialType = 'cv' | 'coverLetter';

export interface ImproveMaterialInput {
  language: 'en';
  materialType: MaterialType;
  currentMarkdown: string;
  instructions: ImproveMaterialInstructions;
  improvementContext?: EvaluateApplicationStrengthOutput;
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
}

type HandlerEvent = {
  arguments: ImproveMaterialInput;
};

const SYSTEM_PROMPT = `You are an expert editorial career coach improving an existing professional document.

Return ONLY the final improved document in valid Markdown.
Do not return JSON.
Do not include explanations or commentary.
Do not wrap output in code fences.

PRIORITY ORDER (STRICT):
1) Obey USER IMPROVEMENT INSTRUCTIONS exactly.
2) Preserve factual accuracy (no invention).
3) Apply improvement context and grounding context.
4) Maintain coherent language and structure.

HARD RULES:
- Never invent facts.
- Do not create new roles, employers, dates, tools, skills, achievements, metrics, or education.
- Only use information present in the provided document and structured grounding context.
- If no measurable metrics are available, do NOT fabricate numbers.
- Maintain the original language.
- Keep tone and structure coherent across the entire document.

FORMAT RULES:
- materialType="cv": use concise, scan-friendly sections and impact bullets.
- materialType="coverLetter": write a coherent one-page letter with 3 to 4 short paragraphs.
- Output ONLY the final Markdown document.`;

const STRICT_MARKDOWN_RETRY_APPENDIX = `

CRITICAL FORMAT ENFORCEMENT:
- Return ONLY valid Markdown.
- No JSON object.
- No JSON array.
- No code fences.
- No commentary.
- Return the full rewritten document only.`;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];
  for (const item of value) {
    const normalized = sanitizeText(item);
    if (normalized.length === 0) continue;
    result.push(normalized);
  }
  return result;
}

function sanitizeNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type ImprovementSummary = {
  overallScore: number;
  weakDimensions: string[];
  missingSignals: string[];
  priorityActions: string[];
  readerNotes: string[];
};

type DimensionKey = 'atsReadiness' | 'clarityFocus' | 'targetedFitSignals' | 'evidenceStrength';

function sanitizeDecisionLabel(value: unknown): 'strong' | 'borderline' | 'risky' {
  return value === 'strong' || value === 'borderline' || value === 'risky' ? value : 'risky';
}

function sanitizeImpact(value: unknown): 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function sanitizeTargetDocument(value: unknown): 'cv' | 'coverLetter' {
  return value === 'coverLetter' ? 'coverLetter' : 'cv';
}

function assertRequiredString(value: unknown, fieldName: string) {
  if (sanitizeText(value).length === 0) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:${fieldName}`);
  }
}

function normalizeImprovementContext(value: unknown): EvaluateApplicationStrengthOutput {
  const context = isObject(value) ? value : null;
  if (!context) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:improvementContext`);
  }

  const overallScore = sanitizeNumber(context.overallScore);
  if (overallScore === null) {
    throw new Error(
      `${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:improvementContext.overallScore`
    );
  }

  const dimensionScoresRaw = isObject(context.dimensionScores) ? context.dimensionScores : null;
  if (!dimensionScoresRaw) {
    throw new Error(
      `${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:improvementContext.dimensionScores`
    );
  }

  const atsReadiness = sanitizeNumber(dimensionScoresRaw.atsReadiness);
  const clarityFocus = sanitizeNumber(dimensionScoresRaw.clarityFocus);
  const targetedFitSignals = sanitizeNumber(dimensionScoresRaw.targetedFitSignals);
  const evidenceStrength = sanitizeNumber(dimensionScoresRaw.evidenceStrength);
  if (
    atsReadiness === null ||
    clarityFocus === null ||
    targetedFitSignals === null ||
    evidenceStrength === null
  ) {
    throw new Error(
      `${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:improvementContext.dimensionScores.values`
    );
  }

  const missingSignals = sanitizeStringArray(context.missingSignals);
  const topImprovementsRaw = Array.isArray(context.topImprovements) ? context.topImprovements : [];
  const topImprovements: EvaluateApplicationStrengthOutput['topImprovements'] = topImprovementsRaw
    .map((item) => (isObject(item) ? item : null))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const targetDocument: 'cv' | 'coverLetter' = isObject(item.target)
        ? sanitizeTargetDocument(item.target.document)
        : 'cv';
      const targetAnchor = isObject(item.target) ? sanitizeText(item.target.anchor) : 'general';

      return {
        title: sanitizeText(item.title),
        action: sanitizeText(item.action),
        impact: sanitizeImpact(item.impact),
        target: {
          document: targetDocument,
          anchor: targetAnchor,
        },
      };
    })
    .filter((item) => item.title.length > 0 || item.action.length > 0);

  if (topImprovements.length === 0) {
    throw new Error(
      `${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:improvementContext.topImprovements`
    );
  }

  const notesRaw = isObject(context.notes) ? context.notes : {};
  const notes = {
    atsNotes: sanitizeStringArray(notesRaw.atsNotes),
    humanReaderNotes: sanitizeStringArray(notesRaw.humanReaderNotes),
  };

  const decisionRaw = isObject(context.decision) ? context.decision : {};
  const decision = {
    label: sanitizeDecisionLabel(decisionRaw.label),
    readyToApply: Boolean(decisionRaw.readyToApply),
    rationaleBullets: sanitizeStringArray(decisionRaw.rationaleBullets),
  };

  return {
    overallScore,
    dimensionScores: {
      atsReadiness,
      clarityFocus,
      targetedFitSignals,
      evidenceStrength,
    },
    decision,
    missingSignals,
    topImprovements,
    notes,
  };
}

function validateInputShape(input: unknown): ImproveMaterialInput {
  if (!isObject(input)) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:arguments`);
  }

  const materialType = input.materialType;
  if (materialType !== 'cv' && materialType !== 'coverLetter') {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:materialType`);
  }

  assertRequiredString(input.language, 'language');
  if (input.language !== 'en') {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:language.unsupported`);
  }
  assertRequiredString(input.currentMarkdown, 'currentMarkdown');

  const instructions = isObject(input.instructions) ? input.instructions : null;
  if (!instructions) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:instructions`);
  }

  const presets = sanitizeStringArray(instructions.presets);
  if (presets.length === 0) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:instructions.presets`);
  }

  const improvementContext =
    input.improvementContext === undefined || input.improvementContext === null
      ? undefined
      : normalizeImprovementContext(input.improvementContext);

  if (!isObject(input.profile)) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:profile`);
  }

  if (!Array.isArray(input.experiences)) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:experiences`);
  }

  const normalizedInput: ImproveMaterialInput = {
    language: 'en',
    materialType,
    currentMarkdown: sanitizeText(input.currentMarkdown),
    instructions: {
      presets,
      note: sanitizeText(instructions.note) || undefined,
    },
    ...(improvementContext ? { improvementContext } : {}),
    profile: input.profile as Profile,
    experiences: input.experiences as Experience[],
    stories: Array.isArray(input.stories) ? (input.stories as SpeechStory[]) : undefined,
    jobDescription: isObject(input.jobDescription)
      ? (input.jobDescription as JobDescription)
      : undefined,
    matchingSummary: isObject(input.matchingSummary)
      ? (input.matchingSummary as MatchingSummaryContext)
      : undefined,
    company: isObject(input.company) ? (input.company as CompanyProfile) : undefined,
  };

  if (normalizedInput.currentMarkdown.length < MIN_MARKDOWN_LENGTH) {
    throw new Error(`${IMPROVE_MATERIAL_ERROR_CODES.INVALID_INPUT}:currentMarkdown.minLength`);
  }

  return normalizedInput;
}

function toImprovementSummary(context?: EvaluateApplicationStrengthOutput): ImprovementSummary {
  if (!context) {
    return {
      overallScore: 0,
      weakDimensions: [],
      missingSignals: [],
      priorityActions: ['Apply the user improvement instructions while preserving factual accuracy.'],
      readerNotes: [],
    };
  }

  const dimensionEntries = [
    { key: 'atsReadiness', value: context.dimensionScores.atsReadiness },
    { key: 'clarityFocus', value: context.dimensionScores.clarityFocus },
    { key: 'targetedFitSignals', value: context.dimensionScores.targetedFitSignals },
    { key: 'evidenceStrength', value: context.dimensionScores.evidenceStrength },
  ] satisfies Array<{ key: DimensionKey; value: number }>;
  dimensionEntries.sort((a, b) => a.value - b.value);

  const weakDimensions = dimensionEntries
    .filter((entry, index) => entry.value <= 70 || index < 2)
    .slice(0, 3)
    .map((entry) => entry.key);

  const priorityActions = context.topImprovements
    .map((improvement) => improvement.action.trim())
    .filter((action) => action.length > 0)
    .slice(0, 5);

  if (priorityActions.length === 0) {
    priorityActions.push('Improve clarity and role alignment using explicit evidence.');
  }

  return {
    overallScore: context.overallScore,
    weakDimensions,
    missingSignals: context.missingSignals,
    priorityActions,
    readerNotes: context.notes.humanReaderNotes,
  };
}

function buildImprovementContextSummary(context?: EvaluateApplicationStrengthOutput): string {
  const summary = toImprovementSummary(context);
  const score = Number.isFinite(summary.overallScore) ? Math.round(summary.overallScore) : 0;
  const weakDimensions = summary.weakDimensions.length
    ? summary.weakDimensions.join(', ')
    : 'none listed';
  const missingSignals = summary.missingSignals.length
    ? summary.missingSignals.join(', ')
    : 'none listed';
  const priorityActions = summary.priorityActions.map((action, index) => `${index + 1}. ${action}`);
  const readerNotes = summary.readerNotes.map((note, index) => `${index + 1}. ${note}`);

  let formatted = `overallScore: ${score}/100\n`;
  formatted += `weakDimensions: ${weakDimensions}\n`;
  formatted += `missingSignals: ${missingSignals}\n`;
  formatted += `priorityActions:\n${priorityActions.join('\n')}`;

  if (readerNotes.length > 0) {
    formatted += `\nreaderNotes:\n${readerNotes.join('\n')}`;
  }

  return formatted;
}

export function buildUserPrompt(input: ImproveMaterialInput): string {
  const note = input.instructions.note?.trim() ?? '';
  const instructionItems = [...input.instructions.presets, ...(note.length > 0 ? [note] : [])];
  const formattedInstructions = instructionItems.map((instruction) => `- ${instruction}`).join('\n');
  const enforcementChecklist = instructionItems
    .map((instruction, index) => `${index + 1}. ${instruction}`)
    .join('\n');
  const groundingContext = formatAiInputContext({
    language: input.language,
    profile: input.profile,
    experiences: input.experiences,
    stories: input.stories,
    jobDescription: input.jobDescription,
    matchingSummary: input.matchingSummary,
    company: input.company,
  });

  return `
LANGUAGE:
${input.language}

MATERIAL TYPE:
${input.materialType}

MANDATORY USER IMPROVEMENT INSTRUCTIONS (HIGHEST PRIORITY):
${formattedInstructions}

IMPROVEMENT CONTEXT (INTERNAL SUMMARY):
${buildImprovementContextSummary(input.improvementContext)}

CURRENT DOCUMENT:
"""
${input.currentMarkdown}
"""

GROUNDING CONTEXT:
${groundingContext}

MANDATORY COMPLIANCE CHECK (MUST SATISFY ALL):
${enforcementChecklist}

Rewrite the document accordingly and return only the final Markdown.
`.trim();
}

function isMarkdownOutputValid(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length < MIN_MARKDOWN_LENGTH) {
    return false;
  }

  if (/```json/i.test(trimmed) || /```/.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      return false;
    }
  } catch {
    // not JSON: valid for this contract check
  }

  return true;
}

function sanitizeMarkdownOutput(value: string): string {
  const lines = value.trim().split(/\r?\n/);

  while (lines.length > 0 && BOUNDARY_MARKERS.has(lines[0]?.trim() ?? '')) {
    lines.shift();
  }

  while (lines.length > 0 && BOUNDARY_MARKERS.has(lines[lines.length - 1]?.trim() ?? '')) {
    lines.pop();
  }

  return lines.join('\n').trim();
}

async function invokeImprovementPrompt(userPrompt: string): Promise<string> {
  return invokeBedrock({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    operationName: 'improveMaterial',
  });
}

async function improveMarkdownWithRetry(input: ImproveMaterialInput): Promise<string> {
  const prompt = buildUserPrompt(input);
  const first = await invokeImprovementPrompt(prompt);
  const sanitizedFirst = sanitizeMarkdownOutput(first);

  if (isMarkdownOutputValid(sanitizedFirst)) {
    return sanitizedFirst;
  }

  const retry = await invokeImprovementPrompt(`${prompt}${STRICT_MARKDOWN_RETRY_APPENDIX}`);
  const sanitizedRetry = sanitizeMarkdownOutput(retry);
  if (isMarkdownOutputValid(sanitizedRetry)) {
    return sanitizedRetry;
  }

  console.error('[improveMaterial] Falling back to original markdown after invalid model output', {
    code: IMPROVE_MATERIAL_ERROR_CODES.RETRY_FAILED_FALLBACK,
  });
  return input.currentMarkdown;
}

export const handler = async (event: HandlerEvent): Promise<string> => {
  return withAiOperationHandlerObject(
    'improveMaterial',
    event,
    async (args) => {
      const validated = validateInputShape(args);
      const output = await improveMarkdownWithRetry(validated);
      if (!output.trim()) {
        throw new Error(IMPROVE_MATERIAL_ERROR_CODES.INVALID_OUTPUT);
      }
      return output;
    },
    (args) => {
      const parsed: Record<string, unknown> = isObject(args) ? args : {};
      const instructions = isObject(parsed.instructions) ? parsed.instructions : {};
      return {
        language: sanitizeText(parsed.language),
        materialType: sanitizeText(parsed.materialType),
        currentMarkdownPreview: truncateForLog(sanitizeText(parsed.currentMarkdown)),
        presetCount: Array.isArray(instructions.presets) ? instructions.presets.length : 0,
        hasJobDescription: Boolean(parsed.jobDescription),
        hasMatchingSummary: Boolean(parsed.matchingSummary),
        hasCompany: Boolean(parsed.company),
      };
    }
  );
};

export const __testables = {
  validateInputShape,
  isMarkdownOutputValid,
  sanitizeMarkdownOutput,
  buildImprovementContextSummary,
};
