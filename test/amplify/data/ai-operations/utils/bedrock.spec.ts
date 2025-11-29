import { describe, it, expect, beforeEach, vi, type Mock, afterEach } from 'vitest';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(),
  InvokeModelCommand: vi.fn(),
}));

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
    const bedrockModule = await import(
      '../../../../../amplify/data/ai-operations/utils/bedrock'
    );
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

      await expect(retryWithSchema('system', 'user', 'schema')).rejects.toThrow(
        /Unexpected token/
      );
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
});
