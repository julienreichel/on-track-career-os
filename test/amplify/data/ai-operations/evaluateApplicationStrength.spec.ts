import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('ai.evaluateApplicationStrength', () => {
  type Handler = (event: {
    arguments: {
      job: {
        title: string;
        seniorityLevel: string;
        roleSummary: string;
        responsibilities: string[];
      requiredSkills: string[];
      behaviours: string[];
      successCriteria: string[];
      explicitPains: string[];
      atsKeywords: string[];
      };
      cvText: string;
      coverLetterText: string;
      language: string;
    };
  }) => Promise<{
    overallScore: number;
    dimensionScores: {
      atsReadiness: number;
      keywordCoverage: number;
      clarityFocus: number;
      targetedFitSignals: number;
      evidenceStrength: number;
    };
    decision: {
      label: 'strong' | 'borderline' | 'risky';
      readyToApply: boolean;
      rationaleBullets: string[];
    };
    missingSignals: string[];
    topImprovements: Array<{
      title: string;
      action: string;
      impact: 'high' | 'medium' | 'low';
      target: {
        document: 'cv' | 'coverLetter';
        anchor: string;
      };
    }>;
    notes: {
      atsNotes: string[];
      humanReaderNotes: string[];
    };
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

  const extractUserPromptFromFirstCall = (): string => {
    const input = vi.mocked(InvokeModelCommand).mock.calls[0]?.[0] as { body?: string } | undefined;
    if (!input?.body) {
      return '';
    }
    const body = JSON.parse(input.body) as {
      messages?: Array<{ content?: Array<{ text?: string }> }>;
    };
    return body.messages?.[0]?.content?.[0]?.text ?? '';
  };

  const validArguments = {
    job: {
      title: 'Senior Product Manager',
      seniorityLevel: 'Senior',
      roleSummary: 'Drive product strategy and delivery.',
      responsibilities: ['Own roadmap'],
      requiredSkills: ['Stakeholder management'],
      behaviours: ['Ownership'],
      successCriteria: ['Improve adoption'],
      explicitPains: ['Fragmented roadmap'],
      atsKeywords: ['Product strategy', 'Roadmap'],
    },
    cvText: 'Product manager with outcomes in B2B SaaS.',
    coverLetterText: 'I am excited to apply.',
    language: 'en',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    const module = await import('@amplify/data/ai-operations/evaluateApplicationStrength');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('accepts valid output', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        overallScore: 82,
        dimensionScores: {
          atsReadiness: 80,
          keywordCoverage: 81,
          clarityFocus: 82,
          targetedFitSignals: 83,
          evidenceStrength: 84,
        },
        decision: {
          label: 'strong',
          readyToApply: true,
          rationaleBullets: ['Clear fit', 'Strong measurable evidence'],
        },
        missingSignals: ['Board-level stakeholder examples'],
        topImprovements: [
          {
            title: 'Emphasize leadership scope',
            action: 'Add one bullet covering cross-functional leadership impact.',
            impact: 'medium',
            target: { document: 'cv', anchor: 'experience' },
          },
          {
            title: 'Tighten summary',
            action: 'Align summary wording with role priorities.',
            impact: 'low',
            target: { document: 'cv', anchor: 'summary' },
          },
        ],
        notes: {
          atsNotes: ['Keyword usage is strong.'],
          humanReaderNotes: ['Add one concrete scale metric.'],
        },
      })
    );

    const response = await handler({ arguments: validArguments });

    expect(response.overallScore).toBe(82);
    expect(response.dimensionScores.keywordCoverage).toBe(81);
    expect(response.decision.label).toBe('strong');
    expect(response.topImprovements.length).toBeGreaterThanOrEqual(2);
  });

  it('clamps invalid scores', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        overallScore: 999,
        dimensionScores: {
          atsReadiness: -25,
          keywordCoverage: 200,
          clarityFocus: 49.7,
          targetedFitSignals: '101',
          evidenceStrength: null,
        },
        decision: { label: 'strong', readyToApply: true, rationaleBullets: ['A', 'B'] },
        missingSignals: [],
        topImprovements: [],
        notes: { atsNotes: [], humanReaderNotes: [] },
      })
    );

    const response = await handler({ arguments: validArguments });

    expect(response.overallScore).toBe(100);
    expect(response.dimensionScores.atsReadiness).toBe(0);
    expect(response.dimensionScores.keywordCoverage).toBe(100);
    expect(response.dimensionScores.clarityFocus).toBe(50);
    expect(response.dimensionScores.targetedFitSignals).toBe(100);
    expect(response.dimensionScores.evidenceStrength).toBe(0);
  });

  it('fills missing keys', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse({}));

    const response = await handler({ arguments: validArguments });

    expect(response.overallScore).toBe(0);
    expect(response.dimensionScores).toEqual({
      atsReadiness: 0,
      keywordCoverage: 0,
      clarityFocus: 0,
      targetedFitSignals: 0,
      evidenceStrength: 0,
    });
    expect(Array.isArray(response.decision.rationaleBullets)).toBe(true);
    expect(Array.isArray(response.missingSignals)).toBe(true);
    expect(Array.isArray(response.notes.atsNotes)).toBe(true);
    expect(Array.isArray(response.notes.humanReaderNotes)).toBe(true);
  });

  it('enforces at least two improvements', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        overallScore: 60,
        dimensionScores: {
          atsReadiness: 60,
          keywordCoverage: 60,
          clarityFocus: 60,
          targetedFitSignals: 60,
          evidenceStrength: 60,
        },
        decision: { label: 'borderline', readyToApply: false, rationaleBullets: ['A', 'B'] },
        missingSignals: [],
        topImprovements: [
          {
            title: 'Only one',
            action: 'Single action',
            impact: 'high',
            target: { document: 'cv', anchor: 'general' },
          },
        ],
        notes: { atsNotes: [], humanReaderNotes: [] },
      })
    );

    const response = await handler({ arguments: validArguments });

    expect(response.topImprovements.length).toBeGreaterThanOrEqual(2);
  });

  it('coverLetter empty path does not create coverLetter-only targets', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        overallScore: 58,
        dimensionScores: {
          atsReadiness: 58,
          keywordCoverage: 58,
          clarityFocus: 58,
          targetedFitSignals: 58,
          evidenceStrength: 58,
        },
        decision: { label: 'borderline', readyToApply: false, rationaleBullets: ['A', 'B'] },
        missingSignals: [],
        topImprovements: [
          {
            title: 'Rewrite letter opening',
            action: 'Improve cover letter opening paragraph.',
            impact: 'high',
            target: { document: 'coverLetter', anchor: 'coverLetterBody' },
          },
        ],
        notes: { atsNotes: [], humanReaderNotes: [] },
      })
    );

    const response = await handler({
      arguments: {
        ...validArguments,
        coverLetterText: '',
      },
    });

    expect(response.topImprovements.length).toBeGreaterThanOrEqual(2);
    expect(response.topImprovements.every((item) => item.target.document === 'cv')).toBe(true);
  });

  it('cv empty path supports cover-letter-only evaluations', async () => {
    mockSend.mockResolvedValue(
      buildBedrockResponse({
        overallScore: 63,
        dimensionScores: {
          atsReadiness: 63,
          keywordCoverage: 63,
          clarityFocus: 63,
          targetedFitSignals: 63,
          evidenceStrength: 63,
        },
        decision: { label: 'borderline', readyToApply: false, rationaleBullets: ['A', 'B'] },
        missingSignals: [],
        topImprovements: [
          {
            title: 'Strengthen opening',
            action: 'Make opening more role-specific.',
            impact: 'high',
            target: { document: 'cv', anchor: 'summary' },
          },
        ],
        notes: { atsNotes: [], humanReaderNotes: [] },
      })
    );

    const response = await handler({
      arguments: {
        ...validArguments,
        cvText: '',
        coverLetterText: 'I am a strong fit for this role.',
      },
    });

    expect(response.topImprovements.length).toBeGreaterThanOrEqual(2);
    expect(response.topImprovements.every((item) => item.target.document === 'coverLetter')).toBe(
      true
    );
  });

  it('builds prompt conditionally when one document is missing', async () => {
    mockSend.mockResolvedValue(buildBedrockResponse({}));

    await handler({
      arguments: {
        ...validArguments,
        coverLetterText: '',
      },
    });

    const cvOnlyPrompt = extractUserPromptFromFirstCall();
    expect(cvOnlyPrompt).toContain('CV text:');
    expect(cvOnlyPrompt).not.toContain('Cover letter text:');

    vi.clearAllMocks();
    mockSend.mockResolvedValue(buildBedrockResponse({}));

    await handler({
      arguments: {
        ...validArguments,
        cvText: '',
        coverLetterText: 'Cover letter content',
      },
    });

    const coverOnlyPrompt = extractUserPromptFromFirstCall();
    expect(coverOnlyPrompt).toContain('Cover letter text:');
    expect(coverOnlyPrompt).not.toContain('CV text:');
  });
});
