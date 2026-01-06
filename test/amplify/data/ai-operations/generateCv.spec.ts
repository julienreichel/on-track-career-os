import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = vi.fn();
  return {
    BedrockRuntimeClient: vi.fn(() => ({
      send: mockSend,
    })),
    InvokeModelCommand: vi.fn(),
  };
});

/**
 * Unit tests for ai.generateCv Lambda function
 * Tests the actual implementation with mocked Bedrock responses
 */
describe('ai.generateCv', () => {
  let handler: (event: { arguments: any }) => Promise<string>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set environment variable for MODEL_ID
    process.env.MODEL_ID = 'eu.amazon.nova-micro-v1:0';

    // Get the mock send function
    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/generateCv');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  /**
   * Mock AI response generator that creates CV Markdown from user profile
   */
  const generateMockCvMarkdown = (profile: any) => {
    const profileData = profile.userProfile;
    return `# ${profileData.fullName || 'Professional'}

**${profileData.headline || 'Professional'}** | ${profileData.location || 'Remote'}

## Professional Summary

${profileData.goals?.[0] || 'Experienced professional'} with proven track record of ${profileData.strengths?.[0] || 'delivering results'}.

## Professional Experience

### Senior Software Engineer
**TechCorp Inc.** | March 2020 - Present

- Led migration to microservices architecture
- Implemented CI/CD pipeline using Docker
- Mentored team of junior developers

## Skills

Python, JavaScript, AWS, Docker, Kubernetes

## Education

### Bachelor of Science in Computer Science
**University of Technology** | 2014 - 2018`;
  };

  it('should generate CV with complete user data', async () => {
    const mockMarkdown = generateMockCvMarkdown({
      userProfile: {
        fullName: 'John Doe',
        headline: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        goals: ['Lead technical teams'],
        strengths: ['Cloud architecture'],
      },
    });

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    const result = await handler({
      arguments: {
        language: 'en',
        userProfile: {
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          location: 'San Francisco, CA',
        },
        selectedExperiences: [],
      },
    });

    expect(typeof result).toBe('string');
    expect(result).toContain('# John Doe');
    expect(result).toContain('Senior Software Engineer');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate CV with multiple Markdown sections', async () => {
    const mockMarkdown = `# Jane Smith

## Professional Summary

Great developer

## Professional Experience

Work history

## Skills

Technical skills

## Education

CS Degree`;

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    const result = await handler({
      arguments: {
        language: 'en',
        userProfile: { fullName: 'Jane Smith' },
        selectedExperiences: [],
      },
    });

    expect(result).toBe(mockMarkdown);
    expect(result).toContain('## Professional Summary');
    expect(result).toContain('## Professional Experience');
    expect(result).toContain('## Skills');
    expect(result).toContain('## Education');
  });

  it('should handle CV without multiple headers', async () => {
    const mockMarkdown = `# Test User

Some content without headers`;

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    const result = await handler({
      arguments: {
        language: 'en',
        userProfile: { fullName: 'Test User' },
        selectedExperiences: [],
      },
    });

    expect(result).toBe(mockMarkdown);
    expect(result).toContain('# Test User');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle minimal input', async () => {
    const mockMarkdown = `# Professional

## Professional Summary

Seeking opportunities`;

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    const result = await handler({
      arguments: {
        language: 'en',
        userProfile: { fullName: 'Professional' },
        selectedExperiences: [],
      },
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('# Professional');
  });

  it('drops job context when matching summary is missing', async () => {
    const mockMarkdown = `# Tailored CV`;

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    await handler({
      arguments: {
        language: 'en',
        userProfile: { fullName: 'Taylor' },
        selectedExperiences: [],
        jobDescription: {
          title: 'Staff Engineer',
          roleSummary: 'Build scalable systems',
        },
      },
    });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).not.toContain('Staff Engineer');
  });

  it('includes company summary when tailoring context is valid', async () => {
    const mockMarkdown = `# Tailored CV`;

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    await handler({
      arguments: {
        language: 'en',
        userProfile: { fullName: 'Taylor' },
        selectedExperiences: [],
        jobDescription: {
          title: 'Staff Engineer',
          roleSummary: 'Build scalable systems',
        },
        matchingSummary: {
          overallScore: 80,
          scoreBreakdown: {
            skillFit: 35,
            experienceFit: 25,
            interestFit: 10,
            edge: 10,
          },
          recommendation: 'apply',
          reasoningHighlights: ['Strong technical alignment'],
          strengthsForThisRole: ['System design leadership'],
          skillMatch: ['[MATCH] Architecture — led platform redesign'],
          riskyPoints: ['Risk: Limited fintech. Mitigation: highlight adaptability.'],
          impactOpportunities: ['Improve delivery cadence'],
          tailoringTips: ['Emphasize architecture wins'],
        },
        company: {
          companyName: 'Acme Systems',
          industry: 'Logistics',
          sizeRange: '201-500',
          website: 'https://acme.example',
          description: 'AI workflow platform for logistics teams.',
        },
      },
    });

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('COMPANY SUMMARY');
    expect(userPrompt).toContain('Acme Systems');
  });

  it('should generate CV with various section headers', async () => {
    const mockMarkdown = `# Test

## Professional Profile

Summary here

## Work History

Experience here

## Technical Skills

Skills list`;

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: mockMarkdown }],
            },
          },
        })
      ),
    });

    const result = await handler({
      arguments: {
        language: 'en',
        userProfile: { fullName: 'Test' },
        selectedExperiences: [],
      },
    });

    expect(result).toBe(mockMarkdown);
    expect(result).toContain('## Professional Profile');
    expect(result).toContain('## Work History');
    expect(result).toContain('## Technical Skills');
  });
});
