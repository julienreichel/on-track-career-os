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

describe('ai.generateMatchingSummary', () => {
  type Handler = (event: { arguments: unknown }) => Promise<{
    summaryParagraph: string;
    impactAreas: string[];
    contributionMap: string[];
    riskMitigationPoints: string[];
    generatedAt: string;
    needsUpdate: boolean;
    userFitScore?: number;
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

  const validArguments = {
    user: {
      profile: {
        fullName: 'Casey Candidate',
        strengths: ['Mentorship'],
      },
      experienceSignals: {
        experiences: [
          {
            title: 'Engineering Manager',
            responsibilities: ['Grow team'],
            achievements: ['Improved retention by 10%'],
          },
        ],
      },
    },
    job: {
      title: 'Head of Engineering',
      responsibilities: ['Lead multi-team org'],
      requiredSkills: ['Strategic planning'],
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    const module = await import('@amplify/data/ai-operations/generateMatchingSummary');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns a normalized matching summary', async () => {
    const mockOutput = {
      summaryParagraph: 'Casey can lead the org with empathy.',
      impactAreas: ['Scale delivery', 'Improve retention', 'Improve retention'],
      contributionMap: ['Mentor managers'],
      riskMitigationPoints: ['Needs more healthcare context'],
      userFitScore: 87.5,
    };

    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({ arguments: validArguments as never });

    expect(response.summaryParagraph).toContain('Casey');
    expect(response.impactAreas).toEqual(['Scale delivery', 'Improve retention']);
    expect(response.userFitScore).toBe(87.5);
    expect(response.needsUpdate).toBe(false);
    expect(new Date(response.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('falls back to empty summary when AI output is invalid', async () => {
    mockSend.mockResolvedValueOnce(buildBedrockResponse('not json'));
    mockSend.mockResolvedValueOnce(buildBedrockResponse('still not json'));

    const response = await handler({ arguments: validArguments as never });

    expect(response.summaryParagraph).toBe('');
    expect(response.impactAreas).toEqual([]);
    expect(response.needsUpdate).toBe(true);
  });
});
