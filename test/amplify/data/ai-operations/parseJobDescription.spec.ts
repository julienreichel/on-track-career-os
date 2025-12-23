import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = vi.fn();
  return {
    BedrockRuntimeClient: vi.fn(() => ({
      send: mockSend,
    })),
    InvokeModelCommand: vi.fn(),
  };
});

describe('ai.parseJobDescription', () => {
  let handler: (event: { arguments: { jobText: string } }) => Promise<string>;
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

    const module = await import('@amplify/data/ai-operations/parseJobDescription');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should parse a complete job description', async () => {
    const mockOutput = {
      title: 'Senior Product Manager',
      seniorityLevel: 'Senior',
      roleSummary: 'Drive the analytics roadmap for enterprise customers.',
      responsibilities: ['Define roadmap', 'Lead discovery workshops'],
      requiredSkills: ['Stakeholder management', 'SaaS experience'],
      behaviours: ['Bias for action'],
      successCriteria: ['Adoption increases 20%'],
      explicitPains: ['Fragmented analytics tooling'],
      aiConfidenceScore: 0.92,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: { jobText: 'We are hiring a Senior Product Manager...' },
    });

    const parsed = JSON.parse(response);
    expect(parsed.title).toBe('Senior Product Manager');
    expect(parsed.responsibilities).toEqual(mockOutput.responsibilities);
    expect(parsed.requiredSkills).toEqual(mockOutput.requiredSkills);
    expect(parsed.aiConfidenceScore).toBeCloseTo(0.92);
  });

  it('should apply defaults for partial job descriptions', async () => {
    const mockOutput = {
      title: 'Sales Director',
      responsibilities: ['Grow enterprise pipeline'],
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: { jobText: 'Sales Director role description...' },
    });

    const parsed = JSON.parse(response);
    expect(parsed.title).toBe('Sales Director');
    expect(parsed.seniorityLevel).toBe('');
    expect(parsed.roleSummary).toBe('');
    expect(parsed.requiredSkills).toEqual([]);
    expect(parsed.behaviours).toEqual([]);
    expect(parsed.successCriteria).toEqual([]);
    expect(parsed.explicitPains).toEqual([]);
    expect(parsed.aiConfidenceScore).toBeCloseTo(0.6, 1);
  });

  it('should sanitize poorly structured outputs', async () => {
    const malformedOutput = {
      title: 123,
      seniorityLevel: null,
      roleSummary: undefined,
      responsibilities: 'Own roadmap',
      requiredSkills: [42],
      behaviours: {},
      successCriteria: null,
      explicitPains: null,
      aiConfidenceScore: 2,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(malformedOutput));

    const response = await handler({
      arguments: { jobText: 'Badly formatted JD' },
    });

    const parsed = JSON.parse(response);
    expect(parsed.title).toBe('');
    expect(parsed.seniorityLevel).toBe('');
    expect(parsed.roleSummary).toBe('');
    expect(parsed.responsibilities).toEqual([]);
    expect(parsed.requiredSkills).toEqual([]);
    expect(parsed.behaviours).toEqual([]);
    expect(parsed.successCriteria).toEqual([]);
    expect(parsed.explicitPains).toEqual([]);
    expect(parsed.aiConfidenceScore).toBeLessThanOrEqual(0.25);
  });
});
