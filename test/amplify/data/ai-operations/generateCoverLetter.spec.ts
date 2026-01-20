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

describe('ai.generateCoverLetter', () => {
  type Handler = (event: { arguments: unknown }) => Promise<string>;

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
      goals: ['Build great teams'],
    },
    experiences: [
      {
        title: 'Senior Engineer',
        companyName: 'Tech Corp',
        achievements: ['Led team of 5'],
      },
    ],
    stories: [
      {
        title: 'Team Transformation',
        situation: 'Inherited struggling team',
        task: 'Turn around performance',
        action: 'Implemented mentorship',
        result: 'Team productivity up 40%',
      },
    ],
    personalCanvas: {
      valueProposition: ['Lead reliable delivery'],
    },
    jobDescription: {
      title: 'Head of Engineering',
      roleSummary: 'Scale teams and drive technical excellence',
      requiredSkills: ['Leadership', 'Architecture'],
    },
    matchingSummary: {
      overallScore: 78,
      scoreBreakdown: {
        skillFit: 35,
        experienceFit: 25,
        interestFit: 8,
        edge: 10,
      },
      recommendation: 'apply',
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

    const module = await import('@amplify/data/ai-operations/generateCoverLetter');
    handler = module.handler;
  });

  it('returns normalized cover letter output', async () => {
    const mockContent = `Dear Hiring Manager,

I am excited to apply for the Head of Engineering position. With extensive experience leading technical teams and delivering impactful solutions, I am confident in my ability to scale your engineering organization.

In my previous role as Senior Engineer at Tech Corp, I led a team of 5 engineers and implemented mentorship programs that increased team productivity by 40%. This experience has prepared me to take on larger leadership challenges.

I look forward to discussing how my background aligns with your needs.

Best regards,
Casey Candidate`;

    mockSend.mockResolvedValue(buildBedrockResponse(mockContent));

    const response = await handler({ arguments: validArguments as never });

    expect(response).toContain('Head of Engineering');
    expect(response).toContain('Casey Candidate');
    expect(response).toContain('Tech Corp');
  });

  it('generates generic cover letter when no job description provided', async () => {
    const genericArgs = {
      ...validArguments,
      jobDescription: undefined,
      matchingSummary: undefined,
    };

    mockSend.mockResolvedValue(
      buildBedrockResponse('Generic professional cover letter content showcasing value proposition.')
    );

    await handler({ arguments: genericArgs as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('generic cover letter');
    expect(userPrompt).not.toContain('Head of Engineering');
  });

  it('includes job description context when provided', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse('Tailored cover letter content.'));

    await handler({ arguments: validArguments as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('TARGET JOB DESCRIPTION');
    expect(userPrompt).toContain('Head of Engineering');
    expect(userPrompt).toContain('MATCHING SUMMARY');
    expect(userPrompt).toContain('tailored');
    expect(userPrompt).toContain('COMPANY SUMMARY');
    expect(userPrompt).toContain('Acme Systems');
  });

  it('drops job context when matching summary is missing', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse('Generic cover letter content.'));

    const argsWithoutSummary = { ...validArguments, matchingSummary: undefined };
    await handler({ arguments: argsWithoutSummary as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).not.toContain('Head of Engineering');
  });

  it('validates output schema and returns valid content', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse('Valid cover letter content with proper structure.')
    );

    const response = await handler({ arguments: validArguments as never });

    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('strips preamble and epilogue commentary', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse(
        `Here is your cover letter:

Dear Hiring Manager,

I am excited to apply for the role.

Let me know if you'd like adjustments.`
      )
    );

    const response = await handler({ arguments: validArguments as never });

    expect(response).toContain('Dear Hiring Manager');
    expect(response).not.toContain('Here is your cover letter');
    expect(response).not.toContain("Let me know if you'd like adjustments");
  });

  it('strips code fences when present', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse(
        '```markdown\nDear Hiring Manager,\n\nThank you for your time.\n```\n'
      )
    );

    const response = await handler({ arguments: validArguments as never });

    expect(response).toContain('Dear Hiring Manager');
    expect(response).not.toContain('```');
  });

  it('includes STAR stories in the prompt', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse('Cover letter leveraging STAR stories.'));

    await handler({ arguments: validArguments as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('STORIES');
    expect(userPrompt).toContain('Team Transformation');
  });

  it('includes personal canvas in the prompt', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse('Cover letter with canvas context.'));

    await handler({ arguments: validArguments as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('PERSONAL CANVAS');
    expect(userPrompt).toContain('Lead reliable delivery');
  });

  it('trims whitespace from content', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse('  \n\n  Trimmed content  \n  '));

    const response = await handler({ arguments: validArguments as never });

    expect(response).toBe('Trimmed content');
  });
});
