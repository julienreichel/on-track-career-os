import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AWS Lambda handler for ai.parseCvText
 *
 * PURPOSE:
 * Extract profile fields and experience items from CV text, normalized for downstream processing.
 *
 * CONTRACT:
 * - Never invent information
 * - Return ONLY structured JSON
 * - Use fallback strategies for missing/malformed fields
 *
 * @see docs/AI_Interaction_Contract.md - Operation 1
 */

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You are a CV text parser that extracts structured profile information and experience items.

Return ONLY valid JSON with no markdown wrappers.

HARD RULES:
- Never invent information not explicitly present in the text.
- Do not infer missing details (no guessing location from address unless explicitly written as location).
- Output MUST match the schema exactly: all keys must exist, correct types only.
- Strings must be "" when unknown (never undefined, never null, never "null").
- Arrays must be [] when empty (never a string).
- Each experience item must be a single, non-merged item (one role / one education entry / one volunteer entry / one project).
- If the input is NOT a CV/resume, return ONLY the NonCvSchema.
- If the input IS a CV/resume, return ONLY the CvSchema.

EXTRACTION RULES:
- Extract profile fields if explicitly present: full name, headline, location, seniority level, email, phone, work permit info, social links.
- Extract lists: aspirations, personal values, strengths, interests, skills, certifications, languages.
- Create experienceItems[] by identifying distinct items and assigning experienceType:
  - "work": employment roles
  - "education": degrees/diplomas/schools/universities/training programs
  - "volunteer": volunteer roles, associations, non-paid civic engagement
  - "project": personal/side projects, freelance missions without clear employer structure, portfolio work
- When unsure between "work" and "project": choose "project".
- If a block cannot be classified confidently: put it into rawBlocks instead of creating an experience item.

CONTENT RULES FOR experienceItems:
- Each rawBlock should include the header + dates + location (if present) + responsibilities/achievements.
- Do not split one role into multiple items unless the CV clearly contains multiple distinct roles with different titles/dates.
- Do not merge multiple roles into one item even if they are at the same company.

NORMALIZATION:
- Output profile fields and list values in the target language.
- Preserve the original language in rawBlock (do not translate rawBlock).
- Keep line breaks inside rawBlock if they improve readability.
`;

// Output schema for retry
const OUTPUT_SCHEMA = `CvSchema:
{
  "profile": {
    "fullName": "string",
    "headline": "string",
    "location": "string",
    "seniorityLevel": "string",
    "primaryEmail": "string",
    "primaryPhone": "string",
    "workPermitInfo": "string",
    "socialLinks": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"],
    "interests": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "languages": ["string"]
  },
  "experienceItems": [
    {
      "experienceType": "work|education|volunteer|project",
      "rawBlock": "string"
    }
  ],
  "rawBlocks": ["string"],
  "confidence": 0.95
}

NonCvSchema:
{
  "error": "string"
}`;

// Type definitions matching AI Interaction Contract
export interface ParseCvTextOutput {
  profile: {
    fullName: string;
    headline: string;
    location: string;
    seniorityLevel: string;
    primaryEmail: string;
    primaryPhone: string;
    workPermitInfo: string;
    socialLinks: string[];
    aspirations: string[];
    personalValues: string[];
    strengths: string[];
    interests: string[];
    skills: string[];
    certifications: string[];
    languages: string[];
  };
  experienceItems: {
    experienceType: string;
    rawBlock: string;
  }[];
  rawBlocks: string[];
  confidence: number;
}

export interface ParseCvTextInput {
  cvText: string;
  language: string;
}

const EXPERIENCE_TYPES = ['work', 'education', 'volunteer', 'project'] as const;
const NON_CV_ERROR_CODE = 'ERR_NON_CV_DOCUMENT';

function sanitizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function splitStringToList(value: string): string[] {
  const normalized = value.trim();
  if (!normalized) return [];
  const splitter = normalized.includes('\n') ? '\n' : ',';
  return normalized
    .split(splitter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return splitStringToList(value);
  }

  return [];
}

function sanitizeExperienceItems(
  value: unknown,
  rawBlocks: string[]
): ParseCvTextOutput['experienceItems'] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: ParseCvTextOutput['experienceItems'] = [];

  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const record = entry as Record<string, unknown>;
    const rawBlock = sanitizeString(record.rawBlock ?? record.raw_block);
    const experienceType = sanitizeString(record.experienceType ?? record.experience_type);

    if (!rawBlock) {
      return;
    }

    if (!EXPERIENCE_TYPES.includes(experienceType as (typeof EXPERIENCE_TYPES)[number])) {
      rawBlocks.push(rawBlock);
      return;
    }

    items.push({ experienceType, rawBlock });
  });

  return items;
}

/**
 * Validate and apply fallback rules from AIC
 */
function validateOutput(parsedOutput: Partial<ParseCvTextOutput> | { error?: unknown })
  : ParseCvTextOutput {
  const errorValue = (parsedOutput as { error?: unknown }).error;
  if (typeof errorValue === 'string' && errorValue.trim().length > 0) {
    throw new Error(errorValue.trim() === 'NonCvSchema' ? NON_CV_ERROR_CODE : errorValue.trim());
  }

  const output = parsedOutput as Partial<ParseCvTextOutput>;
  const rawBlocks = sanitizeStringArray(
    output.rawBlocks ?? (output as Record<string, unknown>).raw_blocks
  );

  const profileSource = (output.profile ?? {}) as Record<string, unknown>;
  const getProfileValue = (camelKey: string, snakeKey: string) =>
    profileSource[camelKey] ?? profileSource[snakeKey];
  const profile = {
    fullName: sanitizeString(getProfileValue('fullName', 'full_name')),
    headline: sanitizeString(getProfileValue('headline', 'headline')),
    location: sanitizeString(getProfileValue('location', 'location')),
    seniorityLevel: sanitizeString(getProfileValue('seniorityLevel', 'seniority_level')),
    primaryEmail: sanitizeString(getProfileValue('primaryEmail', 'primary_email')),
    primaryPhone: sanitizeString(getProfileValue('primaryPhone', 'primary_phone')),
    workPermitInfo: sanitizeString(getProfileValue('workPermitInfo', 'work_permit_info')),
    socialLinks: sanitizeStringArray(getProfileValue('socialLinks', 'social_links')),
    aspirations: sanitizeStringArray(getProfileValue('aspirations', 'aspirations')),
    personalValues: sanitizeStringArray(getProfileValue('personalValues', 'personal_values')),
    strengths: sanitizeStringArray(getProfileValue('strengths', 'strengths')),
    interests: sanitizeStringArray(getProfileValue('interests', 'interests')),
    skills: sanitizeStringArray(getProfileValue('skills', 'skills')),
    certifications: sanitizeStringArray(getProfileValue('certifications', 'certifications')),
    languages: sanitizeStringArray(getProfileValue('languages', 'languages')),
  };

  const experienceItems = sanitizeExperienceItems(output.experienceItems, rawBlocks);

  const meaningfulCount =
    [
      profile.fullName,
      profile.headline,
      profile.location,
      profile.seniorityLevel,
      profile.primaryEmail,
      profile.primaryPhone,
      profile.workPermitInfo,
    ].filter((value) => value.length > 0).length +
    [
      profile.socialLinks,
      profile.aspirations,
      profile.personalValues,
      profile.strengths,
      profile.interests,
      profile.skills,
      profile.certifications,
      profile.languages,
      experienceItems,
      rawBlocks,
    ].reduce((count, items) => count + items.length, 0);

  const DEFAULT_CONFIDENCE = 0.5;
  const MIN_MEANINGFUL_COUNT = 2;
  const LOW_CONFIDENCE_CAP = 0.3;

  const rawConfidence =
    typeof output.confidence === 'number' ? output.confidence : DEFAULT_CONFIDENCE;
  const boundedConfidence = Math.min(Math.max(rawConfidence, 0), 1);
  const confidence =
    meaningfulCount < MIN_MEANINGFUL_COUNT
      ? Math.min(boundedConfidence, LOW_CONFIDENCE_CAP)
      : boundedConfidence;

  const hasProfileData =
    [
      profile.fullName,
      profile.headline,
      profile.location,
      profile.seniorityLevel,
      profile.primaryEmail,
      profile.primaryPhone,
      profile.workPermitInfo,
    ].some((value) => value.length > 0) ||
    [
      profile.socialLinks,
      profile.aspirations,
      profile.personalValues,
      profile.strengths,
      profile.interests,
      profile.skills,
      profile.certifications,
      profile.languages,
    ].some((items) => items.length > 0);
  const hasExperienceItems = experienceItems.length > 0;

  if (!hasProfileData && !hasExperienceItems) {
    throw new Error(NON_CV_ERROR_CODE);
  }

  return {
    profile,
    experienceItems,
    rawBlocks,
    confidence,
  };
}

/**
 * Build user prompt from CV text
 */
function buildUserPrompt(cvText: string, language: string): string {
  return `Extract structured profile information and experience items from this CV text:

Target output language: ${language}

${cvText}

Return a JSON object with one of these schemas:
${OUTPUT_SCHEMA}

Important:
- experienceItems: one entry per distinct item (one role / one education / one volunteer / one project). Never merge items.
- rawBlock must contain the full text for that item (header + body).
- rawBlock must preserve the original language (no translation).
- If a profile field is not found: use "" for strings and [] for arrays.
- Never output null (not as JSON null and not as the string "null").
- confidence is a number between 0 and 1.
- If returning NonCvSchema, "error" must be a short human-readable reason.`;
}

/**
 * Main Lambda handler
 */
export const handler = async (event: {
  arguments: ParseCvTextInput;
}): Promise<ParseCvTextOutput> => {
  return withAiOperationHandlerObject(
    'parseCvText',
    event,
    async (args) => {
      const userPrompt = buildUserPrompt(args.cvText, args.language);
      return invokeAiWithRetry<ParseCvTextOutput>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'parseCvText',
      });
    },
    (args) => ({
      cvText: truncateForLog(args.cvText),
      language: args.language,
    })
  );
};
