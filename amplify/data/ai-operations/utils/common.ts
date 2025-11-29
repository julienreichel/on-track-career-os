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
  if (jsonMatch) {
    return jsonMatch[1];
  }
  return text.trim();
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
