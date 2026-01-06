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

describe('ai.generateSpeech', () => {
  type Handler = (event: { arguments: unknown }) => Promise<{
    elevatorPitch: string;
    careerStory: string;
    whyMe: string;
  }>;

  let handler: Handler;
  let mockSend: ReturnType<typeof vi.fn>;

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
    language: 'en',
    profile: {
      fullName: 'Casey Candidate',
      headline: 'Engineering Lead',
      strengths: ['Leadership', 'Mentorship'],
    },
    experiences: [],
    stories: [],
    personalCanvas: {
      valueProposition: ['Lead reliable delivery'],
    },
    jobDescription: {
      title: 'Head of Engineering',
      roleSummary: 'Scale teams',
    },
    matchingSummary: {
      overallScore: 72,
      scoreBreakdown: {
        skillFit: 30,
        experienceFit: 22,
        interestFit: 10,
        edge: 10,
      },
      recommendation: 'maybe',
      reasoningHighlights: ['Strong leadership background'],
      strengthsForThisRole: ['Team scaling'],
      skillMatch: ['[MATCH] Leadership — led teams of 10+'],
      riskyPoints: ['Risk: Limited B2B. Mitigation: emphasize transferable wins.'],
      impactOpportunities: ['Improve delivery cadence'],
      tailoringTips: ['Emphasize mentoring outcomes'],
    },
    company: {
      companyName: 'Acme Systems',
      industry: 'Logistics',
      sizeRange: '201-500',
      website: 'https://acme.example',
      description: 'AI workflow platform for logistics teams.',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    const module = await import('@amplify/data/ai-operations/generateSpeech');
    handler = module.handler;
  });

  it('returns normalized speech output', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        elevatorPitch: 'I lead teams to ship reliable systems.',
        careerStory: 'I grew from developer to engineering lead by focusing on impact.',
        whyMe: 'I align teams with outcomes and deliver consistently.',
      })
    );

    const response = await handler({ arguments: validArguments as never });

    expect(response.elevatorPitch).toContain('I lead teams');
    expect(response.careerStory).toContain('developer');
    expect(response.whyMe).toContain('outcomes');
  });

  it('includes job description context when provided', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        elevatorPitch: 'Short pitch.',
        careerStory: 'Short story.',
        whyMe: 'Short why.',
      })
    );

    await handler({ arguments: validArguments as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('TARGET JOB DESCRIPTION');
    expect(userPrompt).toContain('Head of Engineering');
    expect(userPrompt).toContain('MATCHING SUMMARY');
    expect(userPrompt).toContain('COMPANY SUMMARY');
    expect(userPrompt).toContain('Acme Systems');
  });

  it('drops job context when matching summary is missing', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        elevatorPitch: 'Short pitch.',
        careerStory: 'Short story.',
        whyMe: 'Short why.',
      })
    );

    const argsWithoutSummary = { ...validArguments, matchingSummary: undefined };
    await handler({ arguments: argsWithoutSummary as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).not.toContain('Head of Engineering');
  });

  it('falls back to empty strings when AI output is invalid', async () => {
    mockSend.mockResolvedValueOnce(buildBedrockResponse('not json'));
    mockSend.mockResolvedValueOnce(buildBedrockResponse('still not json'));

    const response = await handler({ arguments: validArguments as never });

    expect(response).toEqual({
      elevatorPitch: '',
      careerStory: '',
      whyMe: '',
    });
  });
});
