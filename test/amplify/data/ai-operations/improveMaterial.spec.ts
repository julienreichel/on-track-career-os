import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = vi.fn();
  return {
    BedrockRuntimeClient: vi.fn(() => ({
      send: mockSend,
    })),
    InvokeModelCommand: vi.fn(),
  };
});

describe('ai.improveMaterial', () => {
  type Handler = (event: { arguments: unknown }) => Promise<string>;

  let handler: Handler;
  let testables: {
    validateInputShape: (input: unknown) => unknown;
    isMarkdownOutputValid: (value: unknown) => boolean;
    sanitizeMarkdownOutput: (value: string) => string;
  };
  let buildUserPrompt: (input: unknown) => string;
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

  const currentMarkdown = `# Alex Candidate

## Summary
Experienced engineer delivering reliable products with measurable outcomes across distributed teams.

## Experience
### Staff Engineer — Acme
- Led migration program reducing deployment lead time by 72% across four squads.
- Improved service reliability from 99.2% to 99.95% through observability standards.
- Mentored six engineers and supported promotion plans across two teams.

## Skills
TypeScript, AWS, Leadership, Architecture, Product collaboration.`;

  const validArguments = {
    language: 'en',
    materialType: 'cv',
    currentMarkdown,
    instructions: {
      presets: ['impact-first', 'concise-bullets'],
      note: 'Focus on role alignment and clarity.',
    },
    improvementContext: {
      overallScore: 58,
      dimensionScores: {
        atsReadiness: 61,
        clarityFocus: 60,
        targetedFitSignals: 52,
        evidenceStrength: 50,
      },
      decision: {
        label: 'borderline',
        readyToApply: false,
        rationaleBullets: ['Needs stronger role alignment', 'Evidence should be more specific'],
      },
      missingSignals: ['Cross-functional stakeholder outcomes'],
      topImprovements: [
        {
          title: 'Strengthen summary positioning',
          action: 'Strengthen summary with role-specific value proposition',
          impact: 'high',
          target: { document: 'cv', anchor: 'summary' },
        },
      ],
      notes: {
        atsNotes: ['Add role keywords in summary and first bullets'],
        humanReaderNotes: ['Show clearer business outcomes in first two bullets'],
      },
    },
    profile: {
      fullName: 'Alex Candidate',
      headline: 'Staff Engineer',
      strengths: ['Leadership'],
      aspirations: ['Scale delivery teams'],
    },
    experiences: [
      {
        id: 'exp-1',
        title: 'Staff Engineer',
        companyName: 'Acme',
        experienceType: 'work',
        responsibilities: ['Lead platform initiatives'],
        tasks: ['Improve reliability and delivery speed'],
      },
    ],
    stories: [
      {
        title: 'Migration initiative',
        situation: 'Legacy deployment bottlenecks',
        task: 'Reduce lead time',
        action: 'Introduced CI optimizations and ownership model',
        result: 'Lead time down 72%',
      },
    ],
  } as const;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    const module = await import('@amplify/data/ai-operations/improveMaterial/handler');
    handler = module.handler;
    buildUserPrompt = module.buildUserPrompt;
    testables = module.__testables;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('rejects invalid input payloads deterministically', () => {
    expect(() => testables.validateInputShape({})).toThrow(
      'ERR_IMPROVE_MATERIAL_INVALID_INPUT:materialType'
    );

    expect(() =>
      testables.validateInputShape({
        ...validArguments,
        currentMarkdown: '',
      })
    ).toThrow('ERR_IMPROVE_MATERIAL_INVALID_INPUT:currentMarkdown');

    expect(() =>
      testables.validateInputShape({
        ...validArguments,
        instructions: { presets: [] },
      })
    ).toThrow('ERR_IMPROVE_MATERIAL_INVALID_INPUT:instructions.presets');
  });

  it('rejects JSON-like output during markdown validation', () => {
    expect(testables.isMarkdownOutputValid('{"markdown": "no"}')).toBe(false);
    expect(testables.isMarkdownOutputValid('```json\n{"a":1}\n```')).toBe(false);
    expect(testables.isMarkdownOutputValid('   [1,2,3]')).toBe(false);
  });

  it('returns original markdown on retry failure', async () => {
    mockSend
      .mockResolvedValueOnce(buildBedrockResponse('{"not":"markdown"}'))
      .mockResolvedValueOnce(buildBedrockResponse('```json\n{"still":"json"}\n```'));

    const response = await handler({ arguments: validArguments as unknown });

    expect(response).toBe(currentMarkdown);
    expect(mockSend).toHaveBeenCalledTimes(2);

    const commandCalls = vi.mocked(InvokeModelCommand).mock.calls;
    const secondCommandInput = commandCalls[1]?.[0] as { body?: string };
    const secondBody = JSON.parse(secondCommandInput.body ?? '{}') as {
      messages?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const retryPrompt = secondBody.messages?.[0]?.content?.[0]?.text ?? '';
    expect(retryPrompt).toContain('CRITICAL FORMAT ENFORCEMENT');
  });

  it('builds prompt without internal operation naming leakage', () => {
    const prompt = buildUserPrompt(validArguments as unknown);
    expect(prompt).toContain('IMPROVEMENT CONTEXT');
    expect(prompt).not.toContain('A2');
  });

  it('strips boundary wrapper markers from model markdown output', async () => {
    const improvedMarkdown = `${currentMarkdown}\n\n## Tailoring\n- Prioritized role-relevant impact statements.`;
    const wrapped = `"""\n---\n${improvedMarkdown}\n---\n"""`;
    mockSend.mockResolvedValueOnce(buildBedrockResponse(wrapped));

    const response = await handler({ arguments: validArguments as unknown });

    expect(response).toBe(improvedMarkdown);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('sanitizes leading and trailing marker-only lines', () => {
    const raw = `\n"""\n---\n# Title\nContent\n---\n"""\n`;
    expect(testables.sanitizeMarkdownOutput(raw)).toBe('# Title\nContent');
  });
});
