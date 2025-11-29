import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MAX_LOG_LENGTH,
  LOG_PREFIX_BASE,
  LOG_ERROR_PREFIX_BASE,
  BEDROCK_REGION,
  MAX_TOKENS,
  INITIAL_TEMPERATURE,
  RETRY_TEMPERATURE,
  extractJson,
  truncateForLog,
  createLogEntry,
  createErrorLogEntry,
} from '../../../../../amplify/data/ai-operations/utils/common';

describe('common utilities', () => {
  describe('constants', () => {
    it('should export correct MAX_LOG_LENGTH', () => {
      expect(MAX_LOG_LENGTH).toBe(100);
    });

    it('should export correct log prefix bases', () => {
      expect(LOG_PREFIX_BASE).toBe('AI Operation');
      expect(LOG_ERROR_PREFIX_BASE).toBe('AI Operation Error');
    });

    it('should export correct Bedrock configuration', () => {
      expect(MAX_TOKENS).toBe(4000);
      expect(INITIAL_TEMPERATURE).toBe(0.3);
      expect(RETRY_TEMPERATURE).toBe(0.1);
    });

    it('should have BEDROCK_REGION from env or default', () => {
      expect(BEDROCK_REGION).toBeDefined();
      expect(typeof BEDROCK_REGION).toBe('string');
    });
  });

  describe('extractJson', () => {
    it('should extract JSON from markdown code block with json tag', () => {
      const input = '```json\n{"key": "value"}\n```';
      const result = extractJson(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON from markdown code block without json tag', () => {
      const input = '```\n{"key": "value"}\n```';
      const result = extractJson(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON with whitespace in code block', () => {
      const input = '```json\n  {"key": "value"}  \n```';
      const result = extractJson(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should handle multiline JSON in code block', () => {
      const input = '```json\n{\n  "key": "value",\n  "nested": {\n    "data": true\n  }\n}\n```';
      const result = extractJson(input);
      expect(result).toBe('{\n  "key": "value",\n  "nested": {\n    "data": true\n  }\n}');
    });

    it('should return trimmed text if no code block', () => {
      const input = '  {"key": "value"}  ';
      const result = extractJson(input);
      expect(result).toBe('{"key": "value"}');
    });

    it('should handle text with no JSON wrapper', () => {
      const input = '{"simple": true}';
      const result = extractJson(input);
      expect(result).toBe('{"simple": true}');
    });

    it('should handle empty string', () => {
      const result = extractJson('');
      expect(result).toBe('');
    });

    it('should handle complex nested JSON in code block', () => {
      const input = '```\n{"data": [{"id": 1}, {"id": 2}]}\n```';
      const result = extractJson(input);
      expect(result).toBe('{"data": [{"id": 1}, {"id": 2}]}');
    });
  });

  describe('truncateForLog', () => {
    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      const result = truncateForLog(text);
      expect(result).toBe('Short text');
    });

    it('should truncate text longer than default max length', () => {
      const text = 'a'.repeat(150);
      const result = truncateForLog(text);
      expect(result).toBe('a'.repeat(100) + '...');
    });

    it('should truncate text at exactly max length', () => {
      const text = 'a'.repeat(100);
      const result = truncateForLog(text);
      expect(result).toBe(text); // No truncation at exact length
    });

    it('should truncate text at 101 characters', () => {
      const text = 'a'.repeat(101);
      const result = truncateForLog(text);
      expect(result).toBe('a'.repeat(100) + '...');
    });

    it('should respect custom max length', () => {
      const text = 'a'.repeat(60);
      const result = truncateForLog(text, 50);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('should handle empty string', () => {
      const result = truncateForLog('');
      expect(result).toBe('');
    });

    it('should handle single character', () => {
      const result = truncateForLog('a', 1);
      expect(result).toBe('a');
    });

    it('should add ellipsis when truncating', () => {
      const text = 'This is a very long text that will be truncated';
      const result = truncateForLog(text, 20);
      expect(result).toHaveLength(23); // 20 chars + '...'
      expect(result).toMatch(/\.\.\.$/);
    });
  });

  describe('createLogEntry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-29T12:00:00.000Z'));
    });

    it('should create log entry with operation name and input', () => {
      const entry = createLogEntry('parseCvText', { cv_text: 'test' });
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        input: { cv_text: 'test' },
      });
    });

    it('should include output when provided', () => {
      const entry = createLogEntry('parseCvText', { cv_text: 'test' }, { sections: [] });
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        input: { cv_text: 'test' },
        output: { sections: [] },
      });
    });

    it('should include fallbacksUsed when provided', () => {
      const entry = createLogEntry(
        'parseCvText',
        { cv_text: 'test' },
        { sections: [] },
        ['default_confidence']
      );
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        input: { cv_text: 'test' },
        output: { sections: [] },
        fallbacksUsed: ['default_confidence'],
      });
    });

    it('should not include empty fallbacksUsed array', () => {
      const entry = createLogEntry('parseCvText', { cv_text: 'test' }, { sections: [] }, []);
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        input: { cv_text: 'test' },
        output: { sections: [] },
      });
    });

    it('should handle undefined output', () => {
      const entry = createLogEntry('parseCvText', { cv_text: 'test' }, undefined);
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        input: { cv_text: 'test' },
      });
    });

    it('should handle multiple fallbacks', () => {
      const entry = createLogEntry('parseCvText', { input: 'test' }, { output: 'result' }, [
        'retry_with_schema',
        'default_confidence',
      ]);
      expect(entry.fallbacksUsed).toEqual(['retry_with_schema', 'default_confidence']);
    });

    it('should create entry with null output', () => {
      const entry = createLogEntry('parseCvText', { cv_text: 'test' }, null);
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        input: { cv_text: 'test' },
        output: null,
      });
    });

    it('should handle complex nested input', () => {
      const complexInput = {
        data: {
          nested: {
            array: [1, 2, 3],
            object: { key: 'value' },
          },
        },
      };
      const entry = createLogEntry('operation', complexInput);
      expect(entry.input).toEqual(complexInput);
    });
  });

  describe('createErrorLogEntry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-29T12:00:00.000Z'));
    });

    it('should create error log entry with error message', () => {
      const error = new Error('Test error');
      const entry = createErrorLogEntry('parseCvText', error, { cv_text: 'test' });
      expect(entry).toEqual({
        timestamp: '2025-11-29T12:00:00.000Z',
        error: 'Test error',
        input: { cv_text: 'test' },
      });
    });

    it('should handle error with empty message', () => {
      const error = new Error('');
      const entry = createErrorLogEntry('parseCvText', error, { cv_text: 'test' });
      expect(entry.error).toBe('');
    });

    it('should include timestamp in ISO format', () => {
      const error = new Error('Error');
      const entry = createErrorLogEntry('operation', error, { input: 'data' });
      expect(entry.timestamp).toBe('2025-11-29T12:00:00.000Z');
    });

    it('should preserve input data', () => {
      const error = new Error('Error');
      const input = { complex: { nested: { data: [1, 2, 3] } } };
      const entry = createErrorLogEntry('operation', error, input);
      expect(entry.input).toEqual(input);
    });

    it('should handle long error messages', () => {
      const longMessage = 'a'.repeat(500);
      const error = new Error(longMessage);
      const entry = createErrorLogEntry('operation', error, { input: 'test' });
      expect(entry.error).toBe(longMessage);
    });
  });
});
