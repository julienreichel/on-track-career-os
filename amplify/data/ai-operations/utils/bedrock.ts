import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BEDROCK_REGION,
  MAX_TOKENS,
  INITIAL_TEMPERATURE,
  RETRY_TEMPERATURE,
  extractJson,
} from './common';

/**
 * Bedrock client wrapper for AI operations
 * Provides consistent Bedrock invocation across all operations
 */

const BEDROCK_MODEL_ID = process.env.MODEL_ID || 'amazon.nova-lite-v1:0';

// Singleton client instance
let bedrockClient: BedrockRuntimeClient | null = null;

/**
 * Get or create Bedrock client instance
 */
function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  }
  return bedrockClient;
}

/**
 * Invoke Bedrock model with given prompt
 */
export async function invokeBedrock(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = MAX_TOKENS,
  temperature: number = INITIAL_TEMPERATURE
): Promise<string> {
  const input: InvokeModelCommandInput = {
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      system: systemPrompt,
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

  const client = getBedrockClient();
  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  if (!response.body) {
    throw new Error('Empty response from Bedrock');
  }

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (!responseBody.content || !responseBody.content[0]?.text) {
    throw new Error('Invalid response structure from Bedrock');
  }

  return responseBody.content[0].text;
}

/**
 * Retry invocation with explicit schema when initial parse fails
 */
export async function retryWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schemaDescription: string
): Promise<T> {
  const retryPrompt = `${userPrompt}

CRITICAL: Return ONLY valid JSON matching this exact schema:
${schemaDescription}

No explanations. No markdown. Just pure JSON.`;

  const responseText = await invokeBedrock(
    systemPrompt,
    retryPrompt,
    MAX_TOKENS,
    RETRY_TEMPERATURE
  );

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error(`AI cannot produce a stable answer. Last error: ${(error as Error).message}`);
  }
}

/**
 * Options for AI invocation with retry
 */
export interface InvokeAiOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  outputSchema: string;
  validate: (parsed: Partial<T>) => T;
  operationName?: string;
}

/**
 * Generic AI invocation with automatic retry logic
 * Handles: invoke → extract JSON → parse → retry on failure → validate
 */
export async function invokeAiWithRetry<T>(options: InvokeAiOptions<T>): Promise<T> {
  const { systemPrompt, userPrompt, outputSchema, validate, operationName } = options;

  // Initial attempt
  let responseText = await invokeBedrock(systemPrompt, userPrompt);

  // Extract JSON from potential markdown wrappers
  responseText = extractJson(responseText);

  // Try to parse
  let parsedOutput: T;
  try {
    parsedOutput = JSON.parse(responseText);
  } catch (parseError) {
    // Retry with explicit schema
    if (operationName) {
      console.error(`AI Operation Error: ${operationName}`, {
        timestamp: new Date().toISOString(),
        error: (parseError as Error).message,
        retrying: true,
      });
    }

    parsedOutput = await retryWithSchema<T>(systemPrompt, userPrompt, outputSchema);

    if (operationName) {
      console.log(`AI Operation: ${operationName} (retry successful)`, {
        timestamp: new Date().toISOString(),
        fallbacksUsed: ['retry_with_schema'],
      });
    }
  }

  // Validate and apply fallbacks
  return validate(parsedOutput);
}
