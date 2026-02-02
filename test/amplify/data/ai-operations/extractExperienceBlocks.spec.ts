import { describe, it, expect, vi, beforeEach } from 'vitest';
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(() => ({
    send: mockSend,
  })),
  InvokeModelCommand: vi.fn((input) => ({ input })),
}));

describe('ai.extractExperienceBlocks', () => {
  let handler: (event: { arguments: unknown }) => Promise<unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@amplify/data/ai-operations/extractExperienceBlocks');
    handler = module.handler;
  });

  function mockAiResponse(payload: unknown) {
    mockSend.mockImplementationOnce(async () => ({
      body: new TextEncoder().encode(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: JSON.stringify(payload) }],
            },
          },
        })
      ),
    }));
  }

  it('zips output to inputs and forces experienceType and status', async () => {
    const experienceItems = [
      { experienceType: 'work', rawBlock: 'Lead Engineer at TechCorp' },
      { experienceType: 'education', rawBlock: 'BSc Computer Science' },
    ];

    mockAiResponse({
      experiences: [
        {
          title: 'Lead Engineer',
          companyName: 'TechCorp',
          startDate: '2021',
          endDate: '2023',
          responsibilities: ['Led team'],
          tasks: ['Shipped product'],
          status: 'draft',
          experienceType: 'project',
        },
      ],
    });

    const result = (await handler({
      arguments: { language: 'en', experienceItems },
    })) as { experiences: Array<Record<string, unknown>> };

    expect(result.experiences).toHaveLength(2);
    expect(result.experiences[0]?.experienceType).toBe('work');
    expect(result.experiences[0]?.status).toBe('draft');
    expect(result.experiences[1]?.experienceType).toBe('education');
    expect(result.experiences[1]?.status).toBe('draft');
  });

  it('coerces arrays and normalizes present end dates', async () => {
    const experienceItems = [{ experienceType: 'work', rawBlock: 'Developer at Acme' }];

    mockAiResponse({
      experiences: [
        {
          title: 'Developer',
          companyName: 'Acme',
          startDate: '2022',
          endDate: 'Present',
          responsibilities: 'Built features,Reviewed code',
          tasks: 'Shipped releases',
          status: 'complete',
          experienceType: 'work',
        },
      ],
    });

    const result = (await handler({
      arguments: { language: 'en', experienceItems },
    })) as { experiences: Array<Record<string, unknown>> };

    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0]?.endDate).toBe('');
    expect(result.experiences[0]?.responsibilities).toEqual(['Built features', 'Reviewed code']);
    expect(result.experiences[0]?.tasks).toEqual(['Shipped releases']);
  });
});
