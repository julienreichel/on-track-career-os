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
const SYSTEM_PROMPT = `You are a CV TEXT EXTRACTOR, not a summarizer.

Goal:
- Extract the CV into structured JSON sections while preserving the original wording and content.
- When you identify a section, keep its full text content.

Critical rules (MUST follow):
1) DO NOT summarize, DO NOT rewrite, DO NOT compress.
2) Preserve content as-is as much as possible (near-verbatim).
3) For each section you detect (Summary, Experience, Education, Skills, etc.), keep ALL lines that belong to that section.
4) For Experience:
   - Each role entry MUST include the header line(s) (company/title/location/dates) AND all subsequent lines that belong to that role until the next role or next section.
   - Keep subheadings like "Responsibilities:", "Key Achievements:", "Projects:", etc. inside the same role text.
   - Keep every bullet line. Do not remove “generic” bullets.
5) If you are unsure whether a line belongs to a role/section, INCLUDE it rather than dropping it.
6) Output ONLY valid JSON. No markdown. No explanations.

Output format:
- Return a JSON object that matches the provided schema exactly.
- For sections.experiencesBlocks: each array item should be the FULL RAW TEXT BLOCK for one role (multi-line string), including bullets and subheadings.
- If a section has no content, return empty array or omit the field

Quality check before returning:
- Every detected role must contain more than just the header line if the input text contains bullets/subcontent for that role.
- Never return an experience item that is only “Title at Company | dates” if the source contains additional lines for that role.
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
${OUTPUT_SCHEMA}`;
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
