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

describe('ai.generateCompanyCanvas', () => {
  type Handler = (event: {
    arguments: {
      companyProfile: {
        companyName: string;
        industry: string;
        sizeRange: string;
        website: string;
        description: string;
        productsServices: string[];
        targetMarkets: string[];
        customerSegments: string[];
        rawNotes: string;
      };
      additionalNotes?: string[];
    };
  }) => Promise<{
    companyName: string;
    customerSegments: string[];
    valuePropositions: string[];
    channels: string[];
    customerRelationships: string[];
    revenueStreams: string[];
    keyResources: string[];
    keyActivities: string[];
    keyPartners: string[];
    costStructure: string[];
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

    const module = await import('@amplify/data/ai-operations/generateCompanyCanvas');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('produces valid Business Model Canvas blocks', async () => {
    const mockOutput = {
      companyName: 'Acme',
      customerSegments: ['SMBs'],
      valuePropositions: ['Automated ops'],
      channels: ['Partners'],
      customerRelationships: ['Self-serve'],
      revenueStreams: ['Subscriptions'],
      keyResources: ['Data'],
      keyActivities: ['Product dev'],
      keyPartners: ['Cloud vendor'],
      costStructure: ['R&D'],
      confidence: 0.8,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: {
        companyProfile: {
          companyName: 'Acme',
          industry: '',
          sizeRange: '',
          website: '',
          description: '',
          productsServices: [],
          targetMarkets: [],
          customerSegments: [],
          rawNotes: '',
        },
        additionalNotes: [],
      },
    });

    expect(response.companyName).toBe('Acme');
    expect(response.customerSegments).toEqual(['SMBs']);
    expect(response.valuePropositions).toEqual(['Automated ops']);
  });

  it('applies defaults and clamps array sizes', async () => {
    const oversized = Array.from({ length: 12 }, (_, index) => `Item ${index}`);
    const mockOutput = {
      companyName: '',
      customerSegments: oversized,
      valuePropositions: ['  Value ', 'Value'],
      channels: null,
      customerRelationships: undefined,
      revenueStreams: {},
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
      confidence: undefined,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: {
        companyProfile: {
          companyName: 'Placeholder',
          industry: '',
          sizeRange: '',
          website: '',
          description: '',
          productsServices: [],
          targetMarkets: [],
          customerSegments: [],
          rawNotes: '',
        },
      },
    });

    expect(response.customerSegments.length).toBe(8);
    expect(response.valuePropositions).toEqual(['Value']);
    expect(response.channels).toEqual([]);
    expect(response.confidence).toBeGreaterThan(0);
  });
});
