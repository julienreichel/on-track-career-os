import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

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
  let handler: (event: { arguments: { jobText: string } }) => Promise<{
    title: string;
    seniorityLevel: string;
    roleSummary: string;
    responsibilities: string[];
    requiredSkills: string[];
    behaviours: string[];
    successCriteria: string[];
    explicitPains: string[];
    atsKeywords: string[];
  }>;
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
      atsKeywords: ['Product Manager', 'Analytics', 'SaaS', 'Stakeholder Management'],
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({
      arguments: { jobText: 'We are hiring a Senior Product Manager...' },
    });

    expect(response.title).toBe('Senior Product Manager');
    expect(response.responsibilities).toEqual(mockOutput.responsibilities);
    expect(response.requiredSkills).toEqual(mockOutput.requiredSkills);
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

    expect(response.title).toBe('Sales Director');
    expect(response.seniorityLevel).toBe('');
    expect(response.roleSummary).toBe('');
    expect(response.requiredSkills).toEqual([]);
    expect(response.behaviours).toEqual([]);
    expect(response.successCriteria).toEqual([]);
    expect(response.explicitPains).toEqual([]);
    expect(response.atsKeywords).toEqual([]);
  });

  it('should throw when output lacks job fields', async () => {
    const malformedOutput = {
      title: 123,
      seniorityLevel: null,
      roleSummary: undefined,
      responsibilities: 'Own roadmap',
      requiredSkills: [42],
      behaviours: {},
      successCriteria: null,
      explicitPains: null,
      atsKeywords: 'keywords',
    };

    mockSend.mockResolvedValue(buildBedrockResponse(malformedOutput));

    await expect(
      handler({
        arguments: { jobText: 'Badly formatted JD' },
      })
    ).rejects.toThrow(
      'ERR_NON_JOB_DESCRIPTION'
    );
  });

  it('should throw when input is not a job description', async () => {
    const nonJobOutput = {
      error: 'NonJobSchema',
    };

    mockSend.mockResolvedValue(buildBedrockResponse(nonJobOutput));

    await expect(
      handler({
        arguments: { jobText: 'Random content' },
      })
    ).rejects.toThrow('ERR_NON_JOB_DESCRIPTION');
  });
});
