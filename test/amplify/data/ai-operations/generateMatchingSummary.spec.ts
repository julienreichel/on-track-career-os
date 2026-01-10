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
    overallScore: number;
    scoreBreakdown: {
      skillFit: number;
      experienceFit: number;
      interestFit: number;
      edge: number;
    };
    recommendation: 'apply' | 'maybe' | 'skip';
    reasoningHighlights: string[];
    strengthsForThisRole: string[];
    skillMatch: string[];
    riskyPoints: string[];
    impactOpportunities: string[];
    tailoringTips: string[];
    generatedAt: string;
    needsUpdate: boolean;
  }>;

  let handler: Handler;
  let mockSend: ReturnType<typeof vi.fn>;
  let mockOutput: Awaited<ReturnType<Handler>>;

  afterEach(() => {
    vi.resetModules();
  });

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
    profile: {
      fullName: 'Casey Candidate',
      strengths: ['Mentorship'],
      skills: ['Leadership', 'Strategic Planning'],
    },
    experiences: [
      {
        title: 'Engineering Manager',
        responsibilities: ['Grow team'],
        achievements: ['Improved retention by 10%'],
      },
    ],
    jobDescription: {
      title: 'Head of Engineering',
      responsibilities: ['Lead multi-team org'],
      requiredSkills: ['Strategic planning', 'Team building', 'Technical architecture'],
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/generateMatchingSummary');
    handler = module.handler;

    mockOutput = {
      overallScore: 75,
      scoreBreakdown: {
        skillFit: 40,
        experienceFit: 25,
        interestFit: 5,
        edge: 5,
      },
      recommendation: 'apply',
      reasoningHighlights: [
        'Casey has strong leadership experience',
        'Strategic planning skills align well',
        'Team mentorship is a key strength',
      ],
      strengthsForThisRole: [
        'Proven team leadership experience',
        'Strategic thinking demonstrated',
        'Strong people management',
      ],
      skillMatch: [
        '[MATCH] Leadership — Engineering Manager role demonstrates this',
        '[MATCH] Strategic Planning — listed in user skills',
        '[PARTIAL] Team building — experience present but limited scale',
        '[MISSING] Technical architecture — not mentioned in profile',
        '[MATCH] Mentorship — core strength for growing teams',
        '[PARTIAL] Healthcare domain — limited context mentioned',
      ],
      riskyPoints: [
        'Risk: Technical architecture experience not evident. Mitigation: Highlight any technical design work.',
        'Risk: Limited multi-team leadership scale. Mitigation: Emphasize potential and learning agility.',
        'Risk: Healthcare context unclear. Mitigation: Research company and address in cover letter.',
      ],
      impactOpportunities: [
        'Scale team processes quickly',
        'Improve retention metrics',
        'Mentor managers effectively',
      ],
      tailoringTips: [
        'Highlight team retention improvement metric',
        'Emphasize strategic planning experience',
        'Address technical architecture in cover letter',
      ],
    };
  });

  it('returns a normalized matching summary with structured output', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse(mockOutput));

    const response = await handler({ arguments: validArguments as never });

    expect(response.overallScore).toBe(75);
    expect(response.scoreBreakdown.skillFit).toBe(40);
    expect(response.recommendation).toBe('apply');
    expect(response.reasoningHighlights).toContain('Casey has strong leadership experience');
    expect(response.skillMatch).toHaveLength(6);
    expect(response.skillMatch[0]).toMatch(/^\[MATCH\]/);
    expect(response.needsUpdate).toBe(false);
    expect(new Date(response.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('falls back to structured empty summary when AI output is invalid', async () => {
    mockSend.mockResolvedValueOnce(buildBedrockResponse('not json'));
    mockSend.mockResolvedValueOnce(buildBedrockResponse('still not json'));

    const response = await handler({ arguments: validArguments as never });

    expect(response.overallScore).toBe(0);
    expect(response.recommendation).toBe('skip');
    expect(response.reasoningHighlights).toHaveLength(3);
    expect(response.skillMatch).toHaveLength(6);
    expect(response.skillMatch.every((s) => s.startsWith('[MISSING]'))).toBe(true);
    expect(response.needsUpdate).toBe(true);
    expect(new Date(response.generatedAt).toString()).not.toBe('Invalid Date');
  });
});
