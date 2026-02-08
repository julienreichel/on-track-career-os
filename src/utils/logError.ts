type LogLevel = 'error' | 'warn';

type LogContext = Record<string, unknown>;

type LogFn = (message: string, error?: unknown, context?: LogContext | unknown) => void;

const REDACT_KEYS = new Set([
  'email',
  'phone',
  'rawtext',
  'cvtext',
  'address',
  'linkedin',
  'primaryemail',
  'primaryphone',
  'sociallinks',
]);

const MAX_DEPTH = 3;
const MAX_KEYS = 40;
const MAX_ARRAY = 30;
const MAX_STRING = 1200;

const truncate = (value: string) => {
  if (value.length <= MAX_STRING) return value;
  const remaining = value.length - MAX_STRING;
  return `${value.slice(0, MAX_STRING)}…[${remaining} chars truncated]`;
};

const shouldRedact = (key: string) => REDACT_KEYS.has(key.toLowerCase());

const sanitize = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return '[Truncated]';

  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message ?? ''),
      stack: value.stack ? truncate(value.stack) : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS);
    const output: Record<string, unknown> = {};
    for (const [key, entryValue] of entries) {
      if (shouldRedact(key)) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = sanitize(entryValue, depth + 1);
      }
    }
    return output;
  }

  return '[Unsupported]';
};

const log = (level: LogLevel, message: string, error?: unknown, context?: LogContext | unknown) => {
  const safeError = error === undefined ? undefined : sanitize(error);
  const safeContext = context === undefined ? undefined : sanitize(context);
  const emit = level === 'error' ? console.error : console.warn;

  if (safeContext === undefined) {
    if (safeError === undefined) {
      emit(message);
    } else {
      emit(message, safeError);
    }
    return;
  }

  emit(message, { error: safeError, context: safeContext });
};

export const logError: LogFn = (message, error, context) => log('error', message, error, context);

export const logWarn: LogFn = (message, error, context) => log('warn', message, error, context);
