/**
 * Shared utilities for AI operations
 * Common functions used across all Lambda handlers
 */

// Logging constants
export const MAX_LOG_LENGTH = 100;
export const LOG_PREFIX_BASE = 'AI Operation';
export const LOG_ERROR_PREFIX_BASE = 'AI Operation Error';

// Bedrock configuration
export const BEDROCK_REGION = process.env.AWS_REGION || 'us-east-1';
export const MAX_TOKENS = 4000;
export const INITIAL_TEMPERATURE = 0.3; // Deterministic parsing
export const RETRY_TEMPERATURE = 0.1; // Even more deterministic on retry

/**
 * Extract JSON from markdown code blocks if present
 * Handles both ```json``` and plain ``` wrappers
 */
export function extractJson(text: string): string {
  // Remove markdown JSON wrapper if present
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch?.[1]) {
    return jsonMatch[1];
  }
  return text.trim();
}

/**
 * Sanitize JSON string by escaping control characters inside string literals.
 */
export function sanitizeJsonString(text: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;
  const CONTROL_CHAR_LIMIT = 0x20;
  const HEX_RADIX = 16;
  const UNICODE_PAD = 4;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] ?? '';
    const code = char.charCodeAt(0);

    if (inString) {
      if (isEscaped) {
        result += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
        result += char;
        continue;
      }

      if (code < CONTROL_CHAR_LIMIT) {
        switch (char) {
          case '\n':
            result += '\\n';
            break;
          case '\r':
            result += '\\r';
            break;
          case '\t':
            result += '\\t';
            break;
          default:
            result += `\\u${code.toString(HEX_RADIX).padStart(UNICODE_PAD, '0')}`;
            break;
        }
        continue;
      }

      result += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Truncate text for logging
 */
export function truncateForLog(text: string, maxLength: number = MAX_LOG_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Create log entry with timestamp
 */
export function createLogEntry(
  operationName: string,
  input: unknown,
  output?: unknown,
  fallbacksUsed?: string[]
) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    input,
  };

  if (output !== undefined) {
    entry.output = output;
  }

  if (fallbacksUsed && fallbacksUsed.length > 0) {
    entry.fallbacksUsed = fallbacksUsed;
  }

  return entry;
}

/**
 * Create error log entry
 */
export function createErrorLogEntry(operationName: string, error: Error, input: unknown) {
  return {
    timestamp: new Date().toISOString(),
    error: error.message,
    input,
  };
}

/**
 * Generic Lambda handler wrapper for AI operations
 * Handles common logging, error handling, and execution flow
 *
 * @param operationName - Name of the AI operation (e.g., 'parseCvText')
 * @param event - Lambda event with arguments
 * @param executeFn - Function that executes the AI operation logic
 * @param prepareInput - Function to prepare input for logging (e.g., truncate, transform keys)
 */
export async function withAiOperationHandler<TInput, TOutput>(
  operationName: string,
  event: { arguments: TInput },
  executeFn: (args: TInput) => Promise<TOutput>,
  prepareInput: (args: TInput) => Record<string, unknown>
): Promise<string> {
  const logInput = prepareInput(event.arguments);

  console.log(`${LOG_PREFIX_BASE}: ${operationName}`, {
    timestamp: new Date().toISOString(),
    input: logInput,
  });

  try {
    const output = await executeFn(event.arguments);

    console.log(`${LOG_PREFIX_BASE}: ${operationName}`, {
      timestamp: new Date().toISOString(),
      input: logInput,
      output,
      fallbacksUsed: [],
    });

    return JSON.stringify(output);
  } catch (error) {
    console.error(`${LOG_ERROR_PREFIX_BASE}: ${operationName}`, {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      input: logInput,
    });
    throw error;
  }
}

/**
 * Variant of withAiOperationHandler that returns the output object directly
 * Used for operations that don't return JSON strings (e.g., extractExperienceBlocks)
 */
export async function withAiOperationHandlerObject<TInput, TOutput>(
  operationName: string,
  event: { arguments: TInput },
  executeFn: (args: TInput) => Promise<TOutput>,
  prepareInput: (args: TInput) => Record<string, unknown>
): Promise<TOutput> {
  const logInput = prepareInput(event.arguments);

  console.log(`${LOG_PREFIX_BASE}: ${operationName}`, {
    timestamp: new Date().toISOString(),
    input: logInput,
  });

  try {
    const output = await executeFn(event.arguments);

    console.log(`${LOG_PREFIX_BASE}: ${operationName}`, {
      timestamp: new Date().toISOString(),
      input: logInput,
      output,
      fallbacksUsed: [],
    });

    return output;
  } catch (error) {
    console.error(`${LOG_ERROR_PREFIX_BASE}: ${operationName}`, {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      input: logInput,
    });
    throw error;
  }
}
