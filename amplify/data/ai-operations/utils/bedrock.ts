import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { randomUUID } from 'crypto';
import { PostHog } from 'posthog-node';
import {
  BEDROCK_REGION,
  MAX_TOKENS,
  INITIAL_TEMPERATURE,
  RETRY_TEMPERATURE,
  extractJson,
} from './common';

const MS_TO_SECONDS = 1000;

/**
 * Bedrock client wrapper for AI operations
 * Provides consistent Bedrock invocation across all operations
 */

const BEDROCK_MODEL_ID = process.env.MODEL_ID || 'amazon.nova-lite-v1:0';
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com';

interface LLMGenerationMetrics {
  traceId: string;
  model: string;
  provider: string;
  systemPrompt: string;
  userPrompt: string;
  responseText: string;
  promptTokens: number;
  completionTokens: number;
  temperature: number;
  durationMs: number;
  operationName?: string;
}

interface InvokeBedrockParams {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  operationName?: string;
}

// Singleton client instances
let bedrockClient: BedrockRuntimeClient | null = null;
let posthogClient: PostHog | null = null;

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
 * Get or create PostHog client instance
 */
function getPostHogClient(): PostHog | null {
  if (!POSTHOG_API_KEY) {
    console.log('No PostHog API Keys');
    return null; // PostHog tracking disabled if no API key
  }
  if (!posthogClient) {
    console.log('Creating posthog client');
    posthogClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
    });
  }
  return posthogClient;
}

/**
 * Track LLM generation event in PostHog
 */
function trackLLMGeneration(metrics: LLMGenerationMetrics) {
  const posthog = getPostHogClient();
  if (!posthog) {
    console.log('No Posthog, no capture');
    return;
  }

  console.log('Posthog capture');
  try {
    posthog.capture({
      distinctId: 'backend-ai-operations',
      event: '$ai_generation',
      properties: {
        // Required properties per PostHog documentation
        $ai_trace_id: metrics.traceId,
        $ai_model: metrics.model,
        $ai_provider: metrics.provider,
        $ai_input: [
          { role: 'system', content: metrics.systemPrompt },
          { role: 'user', content: metrics.userPrompt },
        ],
        $ai_input_tokens: metrics.promptTokens,
        $ai_output_choices: [{ role: 'assistant', content: metrics.responseText }],
        $ai_output_tokens: metrics.completionTokens,
        $ai_latency: metrics.durationMs / MS_TO_SECONDS, // Convert to seconds
        // Optional custom properties
        $ai_temperature: metrics.temperature,
        operation: metrics.operationName || 'unknown',
      },
    });
  } catch (error) {
    // Silent fail - don't break AI operations if PostHog fails
    console.warn('PostHog tracking failed:', error);
  }
}

/**
 * Determine provider from model ID
 */
function getProviderFromModel(modelId: string): string {
  if (modelId.includes('nova') || modelId.includes('amazon')) {
    return 'amazon';
  }
  if (modelId.includes('anthropic') || modelId.includes('claude')) {
    return 'anthropic';
  }
  return 'bedrock';
}

/**
 * Extract Nova model response
 */
function extractNovaResponse(responseBody: Record<string, unknown>) {
  const body = responseBody as {
    output?: { message?: { content?: Array<{ text?: string }> } };
    usage?: { inputTokens?: number; outputTokens?: number };
  };

  if (!body.output?.message?.content?.[0]?.text) {
    throw new Error('Invalid response structure from Bedrock Nova');
  }

  return {
    text: body.output.message.content[0].text,
    inputTokens: body.usage?.inputTokens || 0,
    outputTokens: body.usage?.outputTokens || 0,
  };
}

/**
 * Extract Claude model response
 */
function extractClaudeResponse(responseBody: Record<string, unknown>) {
  const body = responseBody as {
    content?: Array<{ text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  if (!body.content?.[0]?.text) {
    throw new Error('Invalid response structure from Bedrock Claude');
  }

  return {
    text: body.content[0].text,
    inputTokens: body.usage?.input_tokens || 0,
    outputTokens: body.usage?.output_tokens || 0,
  };
}

/**
 * Extract model response and token usage
 */
function extractResponseData(responseBody: Record<string, unknown>, isNovaModel: boolean) {
  return isNovaModel ? extractNovaResponse(responseBody) : extractClaudeResponse(responseBody);
}

interface BuildRequestParams {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  isNovaModel: boolean;
}

/**
 * Build model-specific request body
 */
function buildRequestBody(params: BuildRequestParams): string {
  const { systemPrompt, userPrompt, maxTokens, temperature, isNovaModel } = params;

  const body = isNovaModel
    ? {
        // Amazon Nova format
        schemaVersion: 'messages-v1',
        system: [{ text: systemPrompt }],
        messages: [{ role: 'user', content: [{ text: userPrompt }] }],
        inferenceConfig: { max_new_tokens: maxTokens, temperature },
      }
    : {
        // Anthropic Claude format
        anthropic_version: 'bedrock-2023-05-31',
        system: systemPrompt,
        messages: [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
        max_tokens: maxTokens,
        temperature,
      };

  return JSON.stringify(body);
}

/**
 * Invoke Bedrock model with given prompt
 * Supports both Amazon Nova and Anthropic Claude models
 * Tracks LLM usage in PostHog
 */
export async function invokeBedrock(params: InvokeBedrockParams): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = MAX_TOKENS,
    temperature = INITIAL_TEMPERATURE,
    operationName,
  } = params;

  const startTime = Date.now();
  const isNovaModel = BEDROCK_MODEL_ID.includes('nova');

  const input: InvokeModelCommandInput = {
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: buildRequestBody({ systemPrompt, userPrompt, maxTokens, temperature, isNovaModel }),
  };

  const client = getBedrockClient();
  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  if (!response.body) {
    throw new Error('Empty response from Bedrock');
  }

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const { text, inputTokens, outputTokens } = extractResponseData(responseBody, isNovaModel);

  // Track LLM usage in PostHog
  const durationMs = Date.now() - startTime;
  trackLLMGeneration({
    traceId: randomUUID(),
    model: BEDROCK_MODEL_ID,
    provider: getProviderFromModel(BEDROCK_MODEL_ID),
    systemPrompt,
    userPrompt,
    responseText: text,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    temperature,
    durationMs,
    operationName,
  });

  return text;
}

/**
 * Retry invocation with explicit schema when initial parse fails
 */
export async function retryWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schemaDescription: string,
  operationName?: string
): Promise<T> {
  const retryPrompt = `${userPrompt}

CRITICAL: Return ONLY valid JSON matching this exact schema:
${schemaDescription}

No explanations. No markdown. Just pure JSON.`;

  const responseText = await invokeBedrock({
    systemPrompt,
    userPrompt: retryPrompt,
    maxTokens: MAX_TOKENS,
    temperature: RETRY_TEMPERATURE,
    operationName: operationName ? `${operationName}_retry` : undefined,
  });

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
  let responseText = await invokeBedrock({
    systemPrompt,
    userPrompt,
    maxTokens: MAX_TOKENS,
    temperature: INITIAL_TEMPERATURE,
    operationName,
  });

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

    parsedOutput = await retryWithSchema<T>(systemPrompt, userPrompt, outputSchema, operationName);

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
