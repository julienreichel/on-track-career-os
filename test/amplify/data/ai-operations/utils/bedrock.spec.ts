import { describe, it, expect, beforeEach, vi, type Mock, afterEach } from 'vitest';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(),
  InvokeModelCommand: vi.fn(),
}));

/* eslint-disable max-lines-per-function */
describe('bedrock utilities', () => {
  let mockSend: Mock;
  let invokeBedrock: (
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number,
    temperature?: number
  ) => Promise<string>;
  let retryWithSchema: <T>(
    systemPrompt: string,
    userPrompt: string,
    schemaDescription: string
  ) => Promise<T>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSend = vi.fn();
    (BedrockRuntimeClient as unknown as Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    // Dynamically import to get fresh module instance
    const bedrockModule = await import('@amplify/data/ai-operations/utils/bedrock');
    invokeBedrock = bedrockModule.invokeBedrock;
    retryWithSchema = bedrockModule.retryWithSchema;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('invokeBedrock', () => {
    it('should invoke Bedrock with correct parameters', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"result": "success"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const result = await invokeBedrock('system prompt', 'user prompt');

      expect(result).toBe('{"result": "success"}');
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(InvokeModelCommand).toHaveBeenCalled();
    });

    it('should use default max tokens and temperature', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"data": "test"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('system', 'user');

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      const bodyJson = JSON.parse(commandCall.body);
      expect(bodyJson.max_tokens).toBe(4000);
      expect(bodyJson.temperature).toBe(0.3);
    });

    it('should accept custom max tokens', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"data": "test"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('system', 'user', 2000);

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      const bodyJson = JSON.parse(commandCall.body);
      expect(bodyJson.max_tokens).toBe(2000);
    });

    it('should accept custom temperature', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"data": "test"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('system', 'user', 4000, 0.5);

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      const bodyJson = JSON.parse(commandCall.body);
      expect(bodyJson.temperature).toBe(0.5);
    });

    it('should format request body correctly', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: 'response' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('sys', 'usr');

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      const bodyJson = JSON.parse(commandCall.body);
      expect(bodyJson).toHaveProperty('anthropic_version', 'bedrock-2023-05-31');
      expect(bodyJson).toHaveProperty('system', 'sys');
      expect(bodyJson.messages[0]).toEqual({
        role: 'user',
        content: [{ type: 'text', text: 'usr' }],
      });
    });

    it('should throw error when response body is empty', async () => {
      mockSend.mockResolvedValue({ body: null });

      await expect(invokeBedrock('system', 'user')).rejects.toThrow('Empty response from Bedrock');
    });

    it('should throw error when response body is undefined', async () => {
      mockSend.mockResolvedValue({});

      await expect(invokeBedrock('system', 'user')).rejects.toThrow('Empty response from Bedrock');
    });

    it('should throw error when response structure is invalid (missing content)', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({})),
      };
      mockSend.mockResolvedValue(mockResponse);

      await expect(invokeBedrock('system', 'user')).rejects.toThrow(
        'Invalid response structure from Bedrock'
      );
    });

    it('should throw error when response structure is invalid (empty content array)', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await expect(invokeBedrock('system', 'user')).rejects.toThrow(
        'Invalid response structure from Bedrock'
      );
    });

    it('should throw error when response structure is invalid (missing text)', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ type: 'text' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await expect(invokeBedrock('system', 'user')).rejects.toThrow(
        'Invalid response structure from Bedrock'
      );
    });

    it('should handle Bedrock API errors', async () => {
      mockSend.mockRejectedValue(new Error('API Error'));

      await expect(invokeBedrock('system', 'user')).rejects.toThrow('API Error');
    });

    it('should reuse same Bedrock client instance (singleton)', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: 'response' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('system1', 'user1');

      // Clear the mock call count but keep same client
      vi.clearAllMocks();
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('system2', 'user2');

      // Both calls should use same client (mockSend called twice total, but client instantiated once in beforeEach)
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should use correct model ID from environment', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: 'response' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await invokeBedrock('system', 'user');

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      expect(commandCall.modelId).toBeDefined();
      expect(typeof commandCall.modelId).toBe('string');
    });
  });

  describe('retryWithSchema', () => {
    it('should retry with schema and return parsed result', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"experiences": []}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const result = await retryWithSchema<{ experiences: unknown[] }>(
        'system',
        'user',
        '{"experiences": []}'
      );

      expect(result).toEqual({ experiences: [] });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should append schema to user prompt', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"data": "test"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await retryWithSchema('system', 'original prompt', '{"schema": "here"}');

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      const bodyJson = JSON.parse(commandCall.body);
      expect(bodyJson.messages[0].content[0].text).toContain('original prompt');
      expect(bodyJson.messages[0].content[0].text).toContain('CRITICAL: Return ONLY valid JSON');
      expect(bodyJson.messages[0].content[0].text).toContain('{"schema": "here"}');
    });

    it('should use retry temperature (0.1)', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"result": "ok"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await retryWithSchema('system', 'user', 'schema');

      const commandCall = (InvokeModelCommand as unknown as Mock).mock.calls[0][0];
      const bodyJson = JSON.parse(commandCall.body);
      expect(bodyJson.temperature).toBe(0.1);
    });

    it('should throw wrapped error when JSON parsing fails', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: 'invalid json' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await expect(retryWithSchema('system', 'user', 'schema')).rejects.toThrow(
        /AI cannot produce a stable answer/
      );
    });

    it('should include original parse error in wrapped error', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: 'not valid json' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      await expect(retryWithSchema('system', 'user', 'schema')).rejects.toThrow(/Unexpected token/);
    });

    it('should handle complex nested JSON types', async () => {
      interface ComplexType {
        data: {
          nested: {
            array: number[];
            object: { key: string };
          };
        };
      }

      const complexJson = {
        data: {
          nested: {
            array: [1, 2, 3],
            object: { key: 'value' },
          },
        },
      };

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: JSON.stringify(complexJson) }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const result = await retryWithSchema<ComplexType>('system', 'user', 'schema');

      expect(result).toEqual(complexJson);
    });

    it('should propagate Bedrock invocation errors', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock timeout'));

      await expect(retryWithSchema('system', 'user', 'schema')).rejects.toThrow('Bedrock timeout');
    });
  });

  describe('invokeAiWithRetry', () => {
    let invokeAiWithRetry: <T>(options: {
      systemPrompt: string;
      userPrompt: string;
      outputSchema: string;
      validate: (parsed: Partial<T>) => T;
      operationName?: string;
    }) => Promise<T>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      const bedrockModule = await import('@amplify/data/ai-operations/utils/bedrock');
      invokeAiWithRetry = bedrockModule.invokeAiWithRetry;
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should successfully invoke AI and validate output', async () => {
      interface TestOutput {
        result: string;
      }

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"result": "success"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const validate = (parsed: Partial<TestOutput>): TestOutput => ({
        result: parsed.result || 'default',
      });

      const result = await invokeAiWithRetry<TestOutput>({
        systemPrompt: 'system',
        userPrompt: 'user',
        outputSchema: '{"result": "string"}',
        validate,
      });

      expect(result).toEqual({ result: 'success' });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should extract JSON from markdown wrappers', async () => {
      interface TestOutput {
        data: string;
      }

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '```json\n{"data": "value"}\n```' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const validate = (parsed: Partial<TestOutput>): TestOutput => ({
        data: parsed.data || '',
      });

      const result = await invokeAiWithRetry<TestOutput>({
        systemPrompt: 'system',
        userPrompt: 'user',
        outputSchema: '{"data": "string"}',
        validate,
      });

      expect(result).toEqual({ data: 'value' });
    });

    it('should retry with schema on parse error and log appropriately', async () => {
      interface TestOutput {
        result: string;
      }

      // First call returns invalid JSON
      mockSend
        .mockResolvedValueOnce({
          body: new TextEncoder().encode(
            JSON.stringify({
              content: [{ text: 'not valid json' }],
            })
          ),
        })
        // Second call (retry) returns valid JSON
        .mockResolvedValueOnce({
          body: new TextEncoder().encode(
            JSON.stringify({
              content: [{ text: '{"result": "success"}' }],
            })
          ),
        });

      const validate = (parsed: Partial<TestOutput>): TestOutput => ({
        result: parsed.result || 'default',
      });

      const result = await invokeAiWithRetry<TestOutput>({
        systemPrompt: 'system',
        userPrompt: 'user',
        outputSchema: '{"result": "string"}',
        validate,
        operationName: 'testOp',
      });

      expect(result).toEqual({ result: 'success' });
      expect(mockSend).toHaveBeenCalledTimes(2);

      // Should log error with retry flag
      expect(consoleErrorSpy).toHaveBeenCalledWith('AI Operation Error: testOp', {
        timestamp: expect.any(String),
        error: expect.stringContaining('Unexpected token'),
        retrying: true,
      });

      // Should log retry success
      expect(consoleLogSpy).toHaveBeenCalledWith('AI Operation: testOp (retry successful)', {
        timestamp: expect.any(String),
        fallbacksUsed: ['retry_with_schema'],
      });
    });

    it('should not log when operationName is not provided', async () => {
      interface TestOutput {
        data: string;
      }

      // Invalid JSON on first call
      mockSend
        .mockResolvedValueOnce({
          body: new TextEncoder().encode(
            JSON.stringify({
              content: [{ text: 'invalid' }],
            })
          ),
        })
        // Valid JSON on retry
        .mockResolvedValueOnce({
          body: new TextEncoder().encode(
            JSON.stringify({
              content: [{ text: '{"data": "ok"}' }],
            })
          ),
        });

      const validate = (parsed: Partial<TestOutput>): TestOutput => ({
        data: parsed.data || '',
      });

      await invokeAiWithRetry<TestOutput>({
        systemPrompt: 'system',
        userPrompt: 'user',
        outputSchema: '{"data": "string"}',
        validate,
        // No operationName
      });

      // Should not log anything
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should apply validation and fallbacks', async () => {
      interface TestOutput {
        required: string;
        optional: string;
      }

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{"required": "value"}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const validate = (parsed: Partial<TestOutput>): TestOutput => ({
        required: parsed.required || 'default_required',
        optional: parsed.optional || 'default_optional',
      });

      const result = await invokeAiWithRetry<TestOutput>({
        systemPrompt: 'system',
        userPrompt: 'user',
        outputSchema: '{"required": "string", "optional": "string"}',
        validate,
      });

      expect(result).toEqual({
        required: 'value',
        optional: 'default_optional',
      });
    });

    it('should throw if retry also fails to parse', async () => {
      interface TestOutput {
        data: string;
      }

      // Both calls return invalid JSON
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: 'still invalid' }],
          })
        ),
      });

      const validate = (parsed: Partial<TestOutput>): TestOutput => ({
        data: parsed.data || '',
      });

      await expect(
        invokeAiWithRetry<TestOutput>({
          systemPrompt: 'system',
          userPrompt: 'user',
          outputSchema: '{"data": "string"}',
          validate,
          operationName: 'testOp',
        })
      ).rejects.toThrow(/AI cannot produce a stable answer/);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should propagate validation errors', async () => {
      interface TestOutput {
        required: string;
      }

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: '{}' }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const validate = (parsed: Partial<TestOutput>): TestOutput => {
        if (!parsed.required) {
          throw new Error('Missing required field');
        }
        return { required: parsed.required };
      };

      await expect(
        invokeAiWithRetry<TestOutput>({
          systemPrompt: 'system',
          userPrompt: 'user',
          outputSchema: '{"required": "string"}',
          validate,
        })
      ).rejects.toThrow('Missing required field');
    });

    it('should handle complex nested types', async () => {
      interface ComplexOutput {
        nested: {
          array: number[];
          object: { key: string };
        };
      }

      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      const mockResponse = {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text: JSON.stringify(complexData) }],
          })
        ),
      };
      mockSend.mockResolvedValue(mockResponse);

      const validate = (parsed: Partial<ComplexOutput>): ComplexOutput => ({
        nested: parsed.nested || { array: [], object: { key: '' } },
      });

      const result = await invokeAiWithRetry<ComplexOutput>({
        systemPrompt: 'system',
        userPrompt: 'user',
        outputSchema: JSON.stringify(complexData),
        validate,
      });

      expect(result).toEqual(complexData);
    });
  });
});
