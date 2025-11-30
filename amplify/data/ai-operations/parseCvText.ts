import { invokeBedrock, retryWithSchema } from './utils/bedrock';
import { extractJson, truncateForLog } from './utils/common';

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
  const { cvText } = event.arguments;
  const truncatedInput = truncateForLog(cvText);

  console.log('AI Operation: parseCvText', {
    timestamp: new Date().toISOString(),
    input: { cv_text: truncatedInput },
  });

  try {
    // Build user prompt
    const userPrompt = buildUserPrompt(cvText);

    // Initial attempt
    let responseText = await invokeBedrock(SYSTEM_PROMPT, userPrompt);

    // Extract JSON from potential markdown wrappers
    responseText = extractJson(responseText);

    // Try to parse
    let parsedOutput: ParseCvTextOutput;
    try {
      parsedOutput = JSON.parse(responseText);
    } catch (parseError) {
      // Retry with explicit schema
      console.error('AI Operation Error: parseCvText', {
        timestamp: new Date().toISOString(),
        error: (parseError as Error).message,
        input: { cv_text: truncatedInput },
      });

      parsedOutput = await retryWithSchema<ParseCvTextOutput>(
        SYSTEM_PROMPT,
        userPrompt,
        OUTPUT_SCHEMA
      );

      console.log('AI Operation: parseCvText (retry successful)', {
        timestamp: new Date().toISOString(),
        fallbacksUsed: ['retry_with_schema'],
      });
    }

    // Validate and apply fallbacks
    const validatedOutput = validateOutput(parsedOutput);

    console.log('AI Operation: parseCvText', {
      timestamp: new Date().toISOString(),
      input: { cv_text: truncatedInput },
      output: validatedOutput,
      fallbacksUsed: parsedOutput.confidence === undefined ? ['default_confidence'] : [],
    });

    return JSON.stringify(validatedOutput);
  } catch (error) {
    console.error('AI Operation Error: parseCvText', {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      input: { cv_text: truncatedInput },
    });
    throw error;
  }
};
