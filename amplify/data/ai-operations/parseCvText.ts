import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

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
const SYSTEM_PROMPT = `You are a CV text parser that extracts structured sections from CV text.
Extract experiences, education, skills, certifications, and other text blocks.
Never invent information not present in the text.
Return ONLY valid JSON with no markdown wrappers.

RULES:
- Extract only information explicitly stated in the CV
- Do not infer or invent missing details
- Categorize text into appropriate sections
- If a section has no content, return empty array
- Return ONLY valid JSON matching the specified schema`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "sections": {
    "experiences": ["string"],
    "education": ["string"],
    "skills": ["string"],
    "certifications": ["string"],
    "rawBlocks": ["string"]
  },
  "confidence": 0.95
}`;

// Type definitions matching AI Interaction Contract
export interface ParseCvTextOutput {
  sections: {
    experiences: string[];
    education: string[];
    skills: string[];
    certifications: string[];
    rawBlocks: string[];
  };
  confidence: number;
}

export interface ParseCvTextInput {
  cvText: string;
}

/**
 * Validate and apply fallback rules from AIC
 */
function validateOutput(parsedOutput: Partial<ParseCvTextOutput>): ParseCvTextOutput {
  // If sections is missing, create empty fallback structure
  const sections = parsedOutput.sections || {
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    rawBlocks: [],
  };

  const validatedSections = {
    experiences: Array.isArray(sections.experiences) ? sections.experiences : [],
    education: Array.isArray(sections.education) ? sections.education : [],
    skills: Array.isArray(sections.skills) ? sections.skills : [],
    certifications: Array.isArray(sections.certifications) ? sections.certifications : [],
    // Support both camelCase and snake_case from AI response
    rawBlocks: Array.isArray(sections.rawBlocks)
      ? sections.rawBlocks
      : Array.isArray((sections as Record<string, unknown>).raw_blocks)
        ? ((sections as Record<string, unknown>).raw_blocks as string[])
        : [],
  };

  // Calculate confidence based on content
  // If all sections are empty, confidence should be low
  const totalItems =
    validatedSections.experiences.length +
    validatedSections.education.length +
    validatedSections.skills.length +
    validatedSections.certifications.length +
    validatedSections.rawBlocks.length;

  let confidence: number;
  if (typeof parsedOutput.confidence === 'number') {
    confidence = parsedOutput.confidence;
  } else {
    confidence = DEFAULT_CONFIDENCE;
  }

  // Override confidence to low if no content was extracted
  if (totalItems === 0) {
    confidence = Math.min(confidence, LOW_CONFIDENCE_THRESHOLD);
  }

  return {
    sections: validatedSections,
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
export const handler = async (event: { arguments: ParseCvTextInput }): Promise<string> => {
  return withAiOperationHandler(
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
