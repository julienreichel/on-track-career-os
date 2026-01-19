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
// eslint-disable-next-line max-lines-per-function
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
    const profileData = profile.profile;
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
      profile: {
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
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          location: 'San Francisco, CA',
        },
        experiences: [],
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
        profile: { fullName: 'Jane Smith' },
        experiences: [],
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
        profile: { fullName: 'Test User' },
        experiences: [],
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
        profile: { fullName: 'Professional' },
        experiences: [],
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
        profile: { fullName: 'Taylor' },
        experiences: [],
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
        profile: { fullName: 'Taylor' },
        experiences: [],
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

  it('includes non-work experience sections and STAR highlights in prompt', async () => {
    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: '# CV' }],
            },
          },
        })
      ),
    });

    await handler({
      arguments: {
        language: 'en',
        profile: { fullName: 'Taylor' },
        experiences: [
          {
            id: 'exp-work',
            title: 'Engineer',
            companyName: 'WorkCo',
            startDate: '2022-01-01',
            experienceType: 'work',
            responsibilities: ['Delivered projects'],
          },
          {
            id: 'exp-edu',
            title: 'BSc Computer Science',
            companyName: 'State University',
            startDate: '2018-01-01',
            experienceType: 'education',
          },
          {
            id: 'exp-vol',
            title: 'Volunteer Mentor',
            companyName: 'TechForGood',
            startDate: '2020-01-01',
            experienceType: 'volunteer',
          },
          {
            id: 'exp-proj',
            title: 'Side Project',
            companyName: 'Personal',
            startDate: '2021-01-01',
            experienceType: 'project',
          },
        ],
        stories: [
          {
            experienceId: 'exp-work',
            situation: 'Legacy system',
            task: 'Improve uptime',
            action: 'Refactored services',
            result: '99.9% uptime',
            achievements: ['Cut incidents by 40%'],
          },
        ],
      },
    });

    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('## WORK EXPERIENCE');
    expect(userPrompt).toContain('## EDUCATION');
    expect(userPrompt).toContain('## VOLUNTEER EXPERIENCE');
    expect(userPrompt).toContain('## PROJECTS');
    expect(userPrompt).toContain('Key Achievements (from STAR stories)');
    expect(userPrompt).toContain('Highlights');
  });

  it('warns and skips tailoring when matching summary is invalid', async () => {
    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: '# CV' }],
            },
          },
        })
      ),
    });

    await handler({
      arguments: {
        language: 'en',
        profile: { fullName: 'Taylor' },
        experiences: [],
        jobDescription: { title: 'Staff Engineer' },
        matchingSummary: {
          overallScore: 80,
          scoreBreakdown: { skillFit: 40 },
        },
      },
    });

    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(warnSpy).toHaveBeenCalled();
    expect(userPrompt).not.toContain('TARGET JOB DESCRIPTION');
    warnSpy.mockRestore();
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
        profile: { fullName: 'Test' },
        experiences: [],
      },
    });

    expect(result).toBe(mockMarkdown);
    expect(result).toContain('## Professional Profile');
    expect(result).toContain('## Work History');
    expect(result).toContain('## Technical Skills');
  });

  it('should include skills, languages, certifications, and interests in prompt', async () => {
    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: '# CV' }],
            },
          },
        })
      ),
    });

    await handler({
      arguments: {
        language: 'en',
        profile: {
          fullName: 'John Doe',
          skills: ['TypeScript', 'Python', 'AWS'],
          languages: ['English', 'Spanish'],
          certifications: ['AWS Certified', 'PMP'],
          interests: ['Open Source', 'Mentoring', 'Public Speaking'],
        },
        experiences: [],
      },
    });

    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('SKILLS (RAW LIST - SYNTHESIZE INTO CATEGORIES)');
    expect(userPrompt).toContain('TypeScript, Python, AWS');
    expect(userPrompt).toContain('## LANGUAGES');
    expect(userPrompt).toContain('English, Spanish');
    expect(userPrompt).toContain('## CERTIFICATIONS');
    expect(userPrompt).toContain('AWS Certified');
    expect(userPrompt).toContain('PMP');
    expect(userPrompt).toContain('INTERESTS (RAW LIST - SELECT 3-5 MOST PROFESSIONAL)');
    expect(userPrompt).toContain('Open Source, Mentoring, Public Speaking');
  });

  it('should strip trailing notes from AI response', async () => {
    const mockMarkdown = `# Jane Smith

## Professional Summary

Great developer

---
Note: This CV was generated based on provided information.`;

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
        profile: { fullName: 'Jane Smith' },
        experiences: [],
      },
    });

    expect(result).toContain('Great developer');
    expect(result).not.toContain('Note: This CV was generated');
    expect(result).not.toContain('---');
  });

  it('should strip code fences from AI response', async () => {
    const mockMarkdown = `\`\`\`markdown
# Jane Smith

## Professional Summary

Great developer
\`\`\``;

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
        profile: { fullName: 'Jane Smith' },
        experiences: [],
      },
    });

    expect(result).toContain('# Jane Smith');
    expect(result).toContain('Great developer');
    expect(result).not.toContain('```');
  });

  it('should strip leading and trailing code fences separately', async () => {
    const mockMarkdown = `\`\`\`
# Jane Smith

Great developer
\`\`\``;

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
        profile: { fullName: 'Jane Smith' },
        experiences: [],
      },
    });

    expect(result).toContain('# Jane Smith');
    expect(result).not.toContain('```');
  });

  it('should include company summary only when jobDescription and matchingSummary both present', async () => {
    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');

    mockSend.mockResolvedValue({
      body: Buffer.from(
        JSON.stringify({
          output: {
            message: {
              content: [{ text: '# CV' }],
            },
          },
        })
      ),
    });

    await handler({
      arguments: {
        language: 'en',
        profile: { fullName: 'John Doe' },
        experiences: [],
        jobDescription: { title: 'Engineer' },
        matchingSummary: {
          overallScore: 80,
          scoreBreakdown: { skillFit: 40, experienceFit: 20, interestFit: 10, edge: 10 },
          recommendation: 'apply',
          reasoningHighlights: ['Good fit'],
          strengthsForThisRole: ['Leadership'],
          skillMatch: ['Python'],
          riskyPoints: [],
          impactOpportunities: [],
          tailoringTips: ['Focus on impact'],
        },
        company: { companyName: 'Acme Corp', industry: 'Tech' },
      },
    });

    const calls = (InvokeModelCommand as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const commandInput = calls[0][0];
    const payload = JSON.parse(commandInput.body);
    const userPrompt = payload.messages[0].content[0].text as string;

    expect(userPrompt).toContain('TARGET JOB DESCRIPTION');
    expect(userPrompt).toContain('MATCHING SUMMARY');
    expect(userPrompt).toContain('COMPANY SUMMARY');
    expect(userPrompt).toContain('Acme Corp');
  });
});
