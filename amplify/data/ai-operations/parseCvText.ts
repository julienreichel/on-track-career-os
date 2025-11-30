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

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You are a CV text parser.
You MUST return structured JSON only.
Extract distinct sections and normalize them.
Never invent information.`;

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
  if (!parsedOutput.sections) {
    throw new Error('Missing required field: sections');
  }

  return {
    sections: {
      experiences: Array.isArray(parsedOutput.sections.experiences)
        ? parsedOutput.sections.experiences
        : [],
      education: Array.isArray(parsedOutput.sections.education)
        ? parsedOutput.sections.education
        : [],
      skills: Array.isArray(parsedOutput.sections.skills) ? parsedOutput.sections.skills : [],
      certifications: Array.isArray(parsedOutput.sections.certifications)
        ? parsedOutput.sections.certifications
        : [],
      // Support both camelCase and snake_case from AI response
      rawBlocks: Array.isArray(parsedOutput.sections.rawBlocks)
        ? parsedOutput.sections.rawBlocks
        : Array.isArray((parsedOutput.sections as Record<string, unknown>).raw_blocks)
          ? ((parsedOutput.sections as Record<string, unknown>).raw_blocks as string[])
          : [],
    },
    confidence:
      typeof parsedOutput.confidence === 'number' ? parsedOutput.confidence : DEFAULT_CONFIDENCE,
  };
}

/**
 * Build user prompt from CV text
 */
function buildUserPrompt(cvText: string): string {
  return `Extract structured sections from this CV text:
${cvText}`;
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
      cv_text: truncateForLog(args.cvText),
    })
  );
};
