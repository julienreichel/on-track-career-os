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
    const profileData = JSON.parse(profile.userProfile);
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
      userProfile: JSON.stringify({
        fullName: 'John Doe',
        headline: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        goals: ['Lead technical teams'],
        strengths: ['Cloud architecture'],
      }),
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
        userProfile: JSON.stringify({
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          location: 'San Francisco, CA',
        }),
        selectedExperiences: JSON.stringify([]),
      },
    });

    const parsed = JSON.parse(result);
    expect(parsed.markdown).toContain('# John Doe');
    expect(parsed.markdown).toContain('Senior Software Engineer');
    expect(parsed.sections).toBeInstanceOf(Array);
    expect(parsed.sections.length).toBeGreaterThan(0);
  });

  it('should extract sections from Markdown headers', async () => {
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
        userProfile: JSON.stringify({ fullName: 'Jane Smith' }),
        selectedExperiences: JSON.stringify([]),
      },
    });

    const parsed = JSON.parse(result);
    expect(parsed.markdown).toBe(mockMarkdown);
    expect(parsed.sections).toContain('summary');
    expect(parsed.sections).toContain('experience');
    expect(parsed.sections).toContain('skills');
    expect(parsed.sections).toContain('education');
  });

  it('should use fallback sections when no headers found', async () => {
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
        userProfile: JSON.stringify({ fullName: 'Test User' }),
        selectedExperiences: JSON.stringify([]),
      },
    });

    const parsed = JSON.parse(result);
    expect(parsed.markdown).toBe(mockMarkdown);
    expect(parsed.sections).toEqual(['summary', 'experience']); // Fallback
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
        userProfile: JSON.stringify({ fullName: 'Professional' }),
        selectedExperiences: JSON.stringify([]),
      },
    });

    const parsed = JSON.parse(result);
    expect(parsed.markdown).toBeTruthy();
    expect(parsed.sections.length).toBeGreaterThan(0);
  });

  it('should map various section header names', async () => {
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
        userProfile: JSON.stringify({ fullName: 'Test' }),
        selectedExperiences: JSON.stringify([]),
      },
    });

    const parsed = JSON.parse(result);
    expect(parsed.sections).toContain('summary'); // "Professional Profile" → summary
    expect(parsed.sections).toContain('experience'); // "Work History" → experience
    expect(parsed.sections).toContain('skills'); // "Technical Skills" → skills
  });
});
