import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = vi.fn();
  return {
    BedrockRuntimeClient: vi.fn(() => ({
      send: mockSend,
    })),
    InvokeModelCommand: vi.fn(),
  };
});

describe('ai.analyzeCompanyInfo', () => {
  type Handler = (event: { arguments: { companyName: string; rawText: string } }) => Promise<{
    companyProfile: Record<string, unknown>;
    confidence: number;
  }>;

  let handler: Handler;
  let mockSend: ReturnType<typeof vi.fn>;

  const buildBedrockResponse = (payload: unknown) => ({
    body: new TextEncoder().encode(
      JSON.stringify({
        output: {
          message: {
            content: [{ text: typeof payload === 'string' ? payload : JSON.stringify(payload) }],
          },
        },
      })
    ),
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    const module = await import('@amplify/data/ai-operations/analyzeCompanyInfo');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns structured profile', async () => {
    const mockOutput = {
      companyProfile: {
        companyName: 'Acme Robotics',
        industry: 'Robotics',
        sizeRange: '201-500',
        website: 'https://acme.test',
        productsServices: ['Robotic arms'],
        targetMarkets: ['Manufacturing'],
        customerSegments: ['OEMs'],
        description: 'Industrial automation hardware',
      },
      confidence: 0.9,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: {
        companyName: 'Acme',
        rawText: 'Company info text',
      },
    });

    expect(response.companyProfile.companyName).toBe('Acme Robotics');
    expect(response.companyProfile.productsServices).toEqual(['Robotic arms']);
    expect(response.confidence).toBe(0.9);
  });

  it('applies defaults for missing fields', async () => {
    const mockOutput = {
      companyProfile: {},
      confidence: undefined,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: {
        companyName: 'Empty Corp',
        rawText: 'Minimal text',
      },
    });

    expect(response.companyProfile.companyName).toBe('');
    expect(response.companyProfile.productsServices).toEqual([]);
    expect(response.confidence).toBeGreaterThan(0);
  });

  it('dedupes arrays and trims values', async () => {
    const mockOutput = {
      companyProfile: {
        productsServices: [' Platform ', 'Platform'],
        targetMarkets: [' EU ', 'EU'],
      },
      confidence: 0.3,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: {
        companyName: 'Dupes Inc.',
        rawText: 'text',
      },
    });

    expect(response.companyProfile.productsServices).toEqual(['Platform']);
    expect(response.companyProfile.targetMarkets).toEqual(['EU']);
  });
});
