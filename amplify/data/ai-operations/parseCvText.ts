import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock runtime client
const client = new BedrockRuntimeClient();

// Constants
const MAX_LOG_LENGTH = 100;
const JSON_INDENT = 2;
const DEFAULT_CONFIDENCE = 0.5;
const MAX_TOKENS_INITIAL = 4000;
const MAX_TOKENS_RETRY = 4000;
const TEMPERATURE_INITIAL = 0.3;
const TEMPERATURE_RETRY = 0.1;

// Type definitions matching AI Interaction Contract
interface ParseCvTextOutput {
  sections: {
    experiences: string[];
    education: string[];
    skills: string[];
    certifications: string[];
    raw_blocks: string[];
  };
  confidence: number;
}

interface BedrockResponse {
  content: Array<{ text: string }>;
}

interface ParseCvTextEvent {
  arguments: {
    cv_text: string;
  };
}

// System prompt (constant as per AIC)
const SYSTEM_PROMPT = `You are a CV text parser.
You MUST return structured JSON only.
Extract distinct sections and normalize them.
Never invent information.`;

// Output schema for validation
const OUTPUT_SCHEMA = {
  sections: {
    experiences: ['string'],
    education: ['string'],
    skills: ['string'],
    certifications: ['string'],
    raw_blocks: ['string'],
  },
  confidence: 'number (0-1)',
};

/**
 * Extract JSON from AI response (handles markdown code blocks)
 */
function extractJson(aiResponse: string): string {
  const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/({[\s\S]*})/);
  return jsonMatch ? jsonMatch[1] : aiResponse;
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
      raw_blocks: Array.isArray(parsedOutput.sections.raw_blocks)
        ? parsedOutput.sections.raw_blocks
        : [],
    },
    confidence:
      typeof parsedOutput.confidence === 'number' ? parsedOutput.confidence : DEFAULT_CONFIDENCE,
  };
}

/**
 * Invoke Bedrock model with given prompt
 */
async function invokeBedrock(
  userPrompt: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const input: InvokeModelCommandInput = {
    modelId: process.env.MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userPrompt }],
        },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  };

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);
  const data: BedrockResponse = JSON.parse(Buffer.from(response.body).toString());
  return data.content[0].text;
}

/**
 * AI Operation: ai.parseCvText
 * Purpose: Extract raw text sections from PDF-extracted CV text and normalize for downstream processing
 * Contract: docs/AI_Interaction_Contract.md
 */
export const handler = async (event: ParseCvTextEvent): Promise<string> => {
  const { cv_text } = event.arguments;

  // User prompt (data-injected as per AIC)
  const userPrompt = `Extract structured sections from this CV text:
${cv_text}`;

  try {
    // Initial attempt
    const aiResponse = await invokeBedrock(userPrompt, MAX_TOKENS_INITIAL, TEMPERATURE_INITIAL);
    const jsonString = extractJson(aiResponse);
    const parsedOutput: ParseCvTextOutput = JSON.parse(jsonString);
    const validatedOutput = validateOutput(parsedOutput);

    // Log for traceability (as per AIC section 7)
    console.log('AI Operation: parseCvText', {
      timestamp: new Date().toISOString(),
      input: { cv_text: cv_text.substring(0, MAX_LOG_LENGTH) + '...' },
      output: validatedOutput,
      fallbacksUsed: parsedOutput.confidence === undefined ? ['default_confidence'] : [],
    });

    return JSON.stringify(validatedOutput);
  } catch (error) {
    console.error('AI Operation Error: parseCvText', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      input: { cv_text: cv_text.substring(0, MAX_LOG_LENGTH) + '...' },
    });

    // Retry with explicit schema prompt (fallback strategy from AIC section 6)
    if (error instanceof SyntaxError) {
      return await retryWithSchema(cv_text);
    }

    throw error;
  }
};

/**
 * Retry parsing with explicit schema in prompt
 */
async function retryWithSchema(cvText: string): Promise<string> {
  const retryPrompt = `Return ONLY VALID JSON matching this exact schema:
${JSON.stringify(OUTPUT_SCHEMA, null, JSON_INDENT)}

Parse this CV text:
${cvText}`;

  try {
    const retryAiResponse = await invokeBedrock(retryPrompt, MAX_TOKENS_RETRY, TEMPERATURE_RETRY);
    const retryJsonString = extractJson(retryAiResponse);
    const retryOutput: ParseCvTextOutput = JSON.parse(retryJsonString);
    const validatedOutput = validateOutput(retryOutput);

    console.log('AI Operation: parseCvText (retry successful)', {
      timestamp: new Date().toISOString(),
      fallbacksUsed: ['retry_with_schema'],
    });

    return JSON.stringify(validatedOutput);
  } catch {
    // Final fallback: return structured error
    throw new Error('AI cannot produce a stable answer. Please refine your input or try again.');
  }
}
