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
    const markdown = `## Elevator Pitch
I lead teams to ship reliable systems and align execution with product intent. Does that sound like the kind of leadership you need?

## Career Story
I started as a developer focused on reliability and delivery, then grew into leading teams that unblock cross-functional partners.

- Mentored engineers and improved delivery cadence across multiple releases.

## Why Me
Your teams need consistent delivery and coaching; I bring repeatable systems and people leadership. Would exploring that fit be useful?`;

    mockSend.mockResolvedValue(buildBedrockResponse(markdown));

    const response = await handler({ arguments: validArguments as never });

    expect(response.elevatorPitch).toContain('I lead teams');
    expect(response.careerStory).toContain('developer');
    expect(response.whyMe).toContain('repeatable systems');
    expect(response.careerStory).toContain('leading teams');
  });

  it('includes job description context when provided', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse('## Elevator Pitch\nTest\n\n## Career Story\nTest\n\n## Why Me\nTest')
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

  it('keeps job context when matching summary is missing', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse('## Elevator Pitch\nTest\n\n## Career Story\nTest\n\n## Why Me\nTest')
    );

    const argsWithoutSummary = { ...validArguments, matchingSummary: undefined };
    await handler({ arguments: argsWithoutSummary as never });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('TARGET JOB DESCRIPTION');
    expect(userPrompt).toContain('Head of Engineering');
    expect(userPrompt).not.toContain('MATCHING SUMMARY');
    expect(userPrompt).toContain('COMPANY SUMMARY');
    expect(userPrompt).toContain('Acme Systems');
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

  it('repairs markdown format once when sections are missing', async () => {
    const repaired = `## Elevator Pitch
Short pitch. Could this be useful to you?

## Career Story
Short story with a paragraph break.

Second paragraph for depth.

## Why Me
Short why me. Shall we explore this?`;

    mockSend.mockResolvedValueOnce(buildBedrockResponse('Missing headings entirely.'));
    mockSend.mockResolvedValueOnce(buildBedrockResponse(repaired));

    const response = await handler({ arguments: validArguments as never });

    expect(response.elevatorPitch).toContain('Short pitch');
    expect(response.careerStory).toContain('Short story with a paragraph break.');
    expect(response.whyMe).toContain('Short why me');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('parses markdown with preamble, code fences, and trailing notes', async () => {
    const markdown = `Preamble note before headings.
\`\`\`markdown
## Elevator Pitch
I lead teams to ship reliable systems. Would that be useful to you?

## Career Story
I grew into leadership by focusing on delivery and mentorship.

- Built reliable release processes
- Coached engineers through change

## Why Me
You need steady execution; I bring repeatable systems and coaching. Should we explore that?
\`\`\`
---
Trailing comment that should be ignored.`;

    mockSend.mockResolvedValue(buildBedrockResponse(markdown));

    const response = await handler({ arguments: validArguments as never });

    expect(response.elevatorPitch).toContain('I lead teams');
    expect(response.careerStory).toContain('delivery and mentorship');
    expect(response.whyMe).toContain('steady execution');
    expect(response.whyMe).not.toContain('Trailing comment');
  });

  it('extracts all paragraphs from multi-paragraph sections', async () => {
    const markdown = `## Elevator Pitch
Hello, I'm a passionate engineering leader with expertise in architecture and technical leadership. I've repeatedly demonstrated my ability to lead complex teams and drive product development. From shaping technical visions to boosting system adoption, my career has been a journey of continuous improvement. I've also contributed to significant advancements in video processing. Now, I'm eager to bring my expertise to new challenges. What's the next big project you're working on?

## Career Story
My career has been a dynamic blend of leadership, technical expertise, and innovative problem-solving. I've repeatedly shown my capability to manage complex systems and drive product development from conception to successful deployment. At previous companies, I shaped technical vision and product strategy, leading to creation of cloud platforms that generated significant revenue growth. My leadership skills were further exemplified through managing cross-functional engineering teams.

One of my proudest achievements was reducing support incidents by 40% through comprehensive troubleshooting guides and automated monitoring tools. This not only enhanced operational reliability but also significantly improved user satisfaction. Another highlight was boosting registration system adoption from 5% to 60% through targeted marketing and streamlined processes. These experiences have honed my ability to balance technical leadership with business priorities.

Throughout my career, I've consistently focused on delivering value through technical excellence and leadership. Whether mentoring students or collaborating with global engineering teams, my goal has always been to inspire and drive success. What role do you see for someone with my blend of skills?

## Why Me
Why me? Because I bring a unique blend of technical expertise, leadership skills, and a proven track record of driving results. I've repeatedly demonstrated my ability to lead complex engineering teams, manage cross-functional collaborations, and deliver innovative solutions that meet both technical and business objectives. My experience shaping technical vision and leading to revenue growth, combined with my tenure improving operational efficiency and achieving 100% team retention, are just a few examples of my impact.

One of my key strengths is my ability to balance technical leadership with a focus on operational efficiency. Whether reducing support incidents by 40% or transitioning to bi-monthly deployment cadence, I've consistently delivered measurable improvements. My technical background in video processing, combined with my leadership in engineering management, makes me uniquely equipped to tackle complex challenges and drive success.

I'm not just looking for a role; I'm seeking an opportunity where my skills and experiences can make a significant impact. What challenges are you facing that someone with my background could help solve?`;

    mockSend.mockResolvedValue(buildBedrockResponse(markdown));

    const response = await handler({ arguments: validArguments as never });

    // Elevator Pitch - single paragraph
    expect(response.elevatorPitch).toContain('passionate engineering leader');
    expect(response.elevatorPitch).toContain("What's the next big project");

    // Career Story - THREE paragraphs
    expect(response.careerStory).toContain('dynamic blend of leadership');
    expect(response.careerStory).toContain('proudest achievements was reducing support incidents by 40%');
    expect(response.careerStory).toContain('consistently focused on delivering value');
    expect(response.careerStory).toContain('What role do you see');

    // Why Me - THREE paragraphs
    expect(response.whyMe).toContain('unique blend of technical expertise');
    expect(response.whyMe).toContain('key strengths is my ability to balance');
    expect(response.whyMe).toContain('not just looking for a role');
    expect(response.whyMe).toContain('What challenges are you facing');

    // Verify no content is truncated
    expect(response.careerStory.split('\n\n').length).toBeGreaterThanOrEqual(3);
    expect(response.whyMe.split('\n\n').length).toBeGreaterThanOrEqual(2);
  });
});
