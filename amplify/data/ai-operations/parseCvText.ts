import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AWS Lambda handler for ai.parseCvText
 *
 * PURPOSE:
 * Extract raw text sections from PDF-extracted CV text and normalize for downstream processing.
 *
 * CONTRACT:
 * - Never invent information
 * - Return ONLY structured JSON
 * - Use fallback strategies for missing/malformed fields
 *
 * @see docs/AI_Interaction_Contract.md - Operation 1
 */

// Configuration
const DEFAULT_CONFIDENCE = 0.5;
const LOW_CONFIDENCE_THRESHOLD = 0.3; // Applied when no content extracted

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You are a CV text parser that extracts structured sections and profile information from CV text.

Extract experiencesBlocks, educationBlocks, skills, certifications, rawBlocks, and personal profile information.
Never invent information not present in the text.
Return ONLY valid JSON with no markdown wrappers.

RULES:
- Extract only information explicitly stated in the CV (do not infer or invent).
- Categorize text into appropriate sections.
- experiencesBlocks MUST contain ONE string per role/position (split by role). Do not merge multiple roles into a single string.
- Each experiencesBlocks item must include the full text for that role (header + bullets + subheadings like "Key Achievements").
- When extracting experiencesBlocks, treat the entire text between a role header and the next role header as a single block, regardless of internal subheadings.
- educationBlocks MUST contain ONE string per education item (split by education entry).
- Skills must be extracted into sections.skills as an array of strings. If none found, return [].
- Certifications must be extracted into sections.certifications as an array of strings. If none found, return [].
- If a section has no content, return [] (empty array).
- Never output the literal string "null" anywhere. Use "" for missing string fields and [] for missing arrays.
- Return ONLY valid JSON matching the specified schema.
`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "sections": {
    "experiencesBlocks": ["string"],
    "educationBlocks": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "rawBlocks": ["string"]
  },
  "profile": {
    "fullName": "string",
    "headline": "string",
    "location": "string",
    "seniorityLevel": "string",
    "goals": ["string"],
    "aspirations": ["string"],
    "personalValues": ["string"],
    "strengths": ["string"],
    "interests": ["string"],
    "languages": ["string"]
  },
  "confidence": 0.95
}`;

// Type definitions matching AI Interaction Contract
export interface ParseCvTextOutput {
  sections: {
    experiencesBlocks: string[];
    educationBlocks: string[];
    skills: string[];
    certifications: string[];
    rawBlocks: string[];
  };
  profile: {
    fullName?: string;
    headline?: string;
    location?: string;
    seniorityLevel?: string;
    goals?: string[];
    aspirations?: string[];
    personalValues?: string[];
    strengths?: string[];
    interests?: string[];
    languages?: string[];
  };
  confidence: number;
}

export interface ParseCvTextInput {
  cvText: string;
}

/**
 * Validate sections and apply fallback for missing or invalid data
 */
function validateSections(
  sections: Partial<ParseCvTextOutput['sections']> | undefined
): ParseCvTextOutput['sections'] {
  const fallbackSections = {
    experiencesBlocks: [],
    educationBlocks: [],
    skills: [],
    certifications: [],
    rawBlocks: [],
  };

  const parsedSections = sections || fallbackSections;

  return {
    experiencesBlocks: Array.isArray(parsedSections.experiencesBlocks)
      ? parsedSections.experiencesBlocks
      : [],
    educationBlocks: Array.isArray(parsedSections.educationBlocks)
      ? parsedSections.educationBlocks
      : [],
    skills: Array.isArray(parsedSections.skills) ? parsedSections.skills : [],
    certifications: Array.isArray(parsedSections.certifications)
      ? parsedSections.certifications
      : [],
    // Support both camelCase and snake_case from AI response
    rawBlocks: Array.isArray(parsedSections.rawBlocks)
      ? parsedSections.rawBlocks
      : Array.isArray((parsedSections as Record<string, unknown>).raw_blocks)
        ? ((parsedSections as Record<string, unknown>).raw_blocks as string[])
        : [],
  };
}

/**
 * Validate profile data and apply fallback for missing or invalid fields
 */
function validateProfile(
  profile: Partial<ParseCvTextOutput['profile']> | undefined
): ParseCvTextOutput['profile'] {
  const parsedProfile = profile || {};

  return {
    fullName: typeof parsedProfile.fullName === 'string' ? parsedProfile.fullName : undefined,
    headline: typeof parsedProfile.headline === 'string' ? parsedProfile.headline : undefined,
    location: typeof parsedProfile.location === 'string' ? parsedProfile.location : undefined,
    seniorityLevel:
      typeof parsedProfile.seniorityLevel === 'string' ? parsedProfile.seniorityLevel : undefined,
    goals: Array.isArray(parsedProfile.goals) ? parsedProfile.goals : [],
    aspirations: Array.isArray(parsedProfile.aspirations) ? parsedProfile.aspirations : [],
    personalValues: Array.isArray(parsedProfile.personalValues) ? parsedProfile.personalValues : [],
    strengths: Array.isArray(parsedProfile.strengths) ? parsedProfile.strengths : [],
    interests: Array.isArray(parsedProfile.interests) ? parsedProfile.interests : [],
    languages: Array.isArray(parsedProfile.languages) ? parsedProfile.languages : [],
  };
}

/**
 * Calculate confidence score based on extracted content
 */
function calculateConfidence(
  sections: ParseCvTextOutput['sections'],
  providedConfidence: number | undefined
): number {
  const totalItems =
    sections.experiencesBlocks.length +
    sections.educationBlocks.length +
    sections.skills.length +
    sections.certifications.length +
    sections.rawBlocks.length;

  const confidence =
    typeof providedConfidence === 'number' ? providedConfidence : DEFAULT_CONFIDENCE;

  // Override confidence to low if no content was extracted
  return totalItems === 0 ? Math.min(confidence, LOW_CONFIDENCE_THRESHOLD) : confidence;
}

/**
 * Validate and apply fallback rules from AIC
 */
function validateOutput(parsedOutput: Partial<ParseCvTextOutput>): ParseCvTextOutput {
  const validatedSections = validateSections(parsedOutput.sections);
  const validatedProfile = validateProfile(parsedOutput.profile);
  const confidence = calculateConfidence(validatedSections, parsedOutput.confidence);

  return {
    sections: validatedSections,
    profile: validatedProfile,
    confidence,
  };
}

/**
 * Build user prompt from CV text
 */
function buildUserPrompt(cvText: string): string {
  return `Extract structured sections from this CV text:

${cvText}

Return a JSON object with this exact structure:
${OUTPUT_SCHEMA}

Important:
- experiencesBlocks: one entry per role (do not merge roles)
- educationBlocks: one entry per education item
- If not found: arrays must be [] and strings must be ""
- Never output "null" as a string`;
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
      const userPrompt = buildUserPrompt(args.cvText);
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
    })
  );
};
