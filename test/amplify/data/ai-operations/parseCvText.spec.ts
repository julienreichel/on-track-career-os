import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

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
 * Unit tests for ai.parseCvText Lambda function
 * Tests the actual implementation with mocked Bedrock responses
 */
describe('ai.parseCvText', () => {
  let handler: (event: { arguments: { cvText: string } }) => Promise<unknown>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set environment variable for MODEL_ID
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    // Get the mock send function
    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/parseCvText');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  const mockCvText = `
John Doe
Senior Software Engineer | San Francisco, CA

EXPERIENCE
Senior Software Engineer at TechCorp (2020-2023)
- Led development of cloud applications

EDUCATION
BS Computer Science, MIT (2018)

SKILLS
JavaScript, Python, AWS

CERTIFICATIONS
AWS Certified Solutions Architect

LANGUAGES
English (Native), Spanish (Fluent)

GOALS
- Lead a distributed engineering team
- Contribute to open source
  `.trim();

  /**
   * Mock AI response generator that simulates actual parsing of CV text
   * Uses regex to extract sections from the input, mimicking real AI behavior
   */
  const generateMockResponse = (cvText: string) => {
    // Extract profile information (first few lines)
    const lines = cvText.split('\n');
    const fullName = lines[0] || undefined;
    const headlineLocationMatch = lines[1]?.match(/^(.+?)(?:\s*\|\s*(.+))?$/);
    const headline = headlineLocationMatch?.[1]?.trim();
    const location = headlineLocationMatch?.[2]?.trim();

    // Extract experiences (lines after EXPERIENCE until next section)
    const experienceMatch = cvText.match(/EXPERIENCE\n([\s\S]*?)(?=\n[A-Z]+\n|$)/);
    const experiences = experienceMatch
      ? experienceMatch[1]
          .trim()
          .split(/\n(?=[A-Z].*?at\s)/)
          .filter((e) => e.trim())
      : [];

    // Extract education (lines after EDUCATION until next section)
    const educationMatch = cvText.match(/EDUCATION\n([\s\S]*?)(?=\n[A-Z]+\n|$)/);
    const education = educationMatch
      ? educationMatch[1]
          .trim()
          .split('\n')
          .filter((e) => e.trim())
      : [];

    // Extract skills (comma-separated after SKILLS)
    const skillsMatch = cvText.match(/SKILLS\n([\s\S]*?)(?=\n[A-Z]+\n|$)/);
    const skills = skillsMatch
      ? skillsMatch[1]
          .trim()
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];

    // Extract certifications (lines after CERTIFICATIONS)
    const certificationsMatch = cvText.match(/CERTIFICATIONS\n([\s\S]*?)(?=\n[A-Z]+\n|$)/);
    const certifications = certificationsMatch
      ? certificationsMatch[1]
          .trim()
          .split('\n')
          .filter((c) => c.trim())
      : [];

    // Extract languages
    const languagesMatch = cvText.match(/LANGUAGES\n([\s\S]*?)(?=\n[A-Z]+\n|$)/);
    const languages = languagesMatch
      ? languagesMatch[1]
          .trim()
          .split(',')
          .map((l) =>
            l
              .trim()
              .replace(/\(.*?\)/, '')
              .trim()
          )
          .filter((l) => l)
      : [];

    // Extract goals
    const goalsMatch = cvText.match(/GOALS\n([\s\S]*?)(?=\n[A-Z]+\n|$)/);
    const goals = goalsMatch
      ? goalsMatch[1]
          .trim()
          .split('\n')
          .map((g) => g.replace(/^-\s*/, '').trim())
          .filter((g) => g)
      : [];

    return {
      sections: {
        experiences,
        education,
        skills,
        certifications,
        rawBlocks: [],
      },
      profile: {
        fullName,
        headline,
        location,
        seniorityLevel: headline?.includes('Senior') ? 'Senior' : undefined,
        goals,
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        languages,
      },
      confidence: 0.95,
    };
  };

  describe('Handler Integration Tests', () => {
    it('should successfully parse CV text with valid Bedrock response', async () => {
      // Mock Bedrock to simulate actual parsing of input
      mockSend.mockImplementationOnce(async () => {
        // Get the command input from InvokeModelCommand constructor
        const commandCall = (vi.mocked(InvokeModelCommand).mock.calls[0] as unknown[])[0] as {
          body: string;
        };
        const requestBody = JSON.parse(commandCall.body);
        const userPrompt = requestBody.messages[0].content[0].text;

        // Extract CV text from prompt (after "CV text to parse:")
        const cvTextMatch = userPrompt.match(/CV text to parse:\n([\s\S]*)/);
        const extractedCvText = cvTextMatch ? cvTextMatch[1].trim() : mockCvText;

        const mockResponse = generateMockResponse(extractedCvText);

        return {
          body: new TextEncoder().encode(
            JSON.stringify({
              output: {
                message: {
                  content: [{ text: JSON.stringify(mockResponse) }],
                },
              },
            })
          ),
        };
      });

      const result = await handler({
        arguments: { cvText: mockCvText },
      });

      const parsed = result as {
        sections: {
          experiences: string[];
          education: string[];
          skills: string[];
          certifications: string[];
        };
        profile: {
          fullName?: string;
          headline?: string;
          location?: string;
          seniorityLevel?: string;
          languages: string[];
          goals: string[];
        };
        confidence: number;
      };
      expect(parsed.sections.experiences).toHaveLength(1);
      expect(parsed.sections.experiences[0]).toContain('TechCorp');
      expect(parsed.sections.education).toHaveLength(1);
      expect(parsed.sections.education[0]).toContain('MIT');
      expect(parsed.sections.skills).toHaveLength(3);
      expect(parsed.sections.skills).toContain('JavaScript');
      expect(parsed.sections.certifications).toHaveLength(1);
      expect(parsed.sections.certifications[0]).toContain('AWS Certified');

      // Verify profile information extraction
      expect(parsed.profile).toBeDefined();
      expect(parsed.profile.fullName).toBe('John Doe');
      expect(parsed.profile.headline).toBe('Senior Software Engineer');
      expect(parsed.profile.location).toBe('San Francisco, CA');
      expect(parsed.profile.seniorityLevel).toBe('Senior');
      expect(parsed.profile.languages).toContain('English');
      expect(parsed.profile.languages).toContain('Spanish');
      expect(parsed.profile.goals).toHaveLength(2);
      expect(parsed.profile.goals[0]).toContain('distributed engineering team');

      expect(parsed.confidence).toBe(0.95);
    });
    it('should validate output structure and apply operation-specific fallbacks', async () => {
      const mockBedrockResponse = {
        sections: {
          experiences: ['Some experience'],
          // Missing fields will be filled by operation-specific validation
        },
        profile: {
          fullName: 'Test User',
          // Missing profile fields will be filled by validation
        },
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: JSON.stringify(mockBedrockResponse) }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { cvText: mockCvText },
      });

      const parsed = result as {
        sections: {
          experiences: string[];
          education: string[];
          skills: string[];
          certifications: string[];
          rawBlocks: string[];
        };
        profile: {
          fullName?: string;
          goals: string[];
          aspirations: string[];
          personalValues: string[];
          strengths: string[];
          interests: string[];
          languages: string[];
        };
        confidence: number;
      };
      expect(parsed.sections.experiences).toEqual(['Some experience']);
      // Operation-specific validation fills missing fields
      expect(parsed.sections.education).toEqual([]);
      expect(parsed.sections.skills).toEqual([]);
      expect(parsed.sections.certifications).toEqual([]);
      expect(parsed.sections.rawBlocks).toEqual([]);

      // Verify profile validation
      expect(parsed.profile).toBeDefined();
      expect(parsed.profile.fullName).toBe('Test User');
      expect(parsed.profile.goals).toEqual([]);
      expect(parsed.profile.aspirations).toEqual([]);
      expect(parsed.profile.languages).toEqual([]);

      expect(parsed.confidence).toBe(0.5); // DEFAULT_CONFIDENCE fallback
    });

    it('should apply fallback when sections field is missing', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      // Missing required sections field
                      confidence: 0.5,
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { cvText: mockCvText },
      });
      const result = resultString as {
        sections: {
          experiences: string[];
          education: string[];
          skills: string[];
          certifications: string[];
          rawBlocks: string[];
        };
        profile: {
          goals: string[];
          aspirations: string[];
          personalValues: string[];
          strengths: string[];
          interests: string[];
          languages: string[];
        };
        confidence: number;
      };

      // Should apply fallback structure for missing sections
      expect(result.sections).toBeDefined();
      expect(result.sections.experiences).toEqual([]);
      expect(result.sections.education).toEqual([]);
      expect(result.sections.skills).toEqual([]);
      expect(result.sections.certifications).toEqual([]);
      expect(result.sections.rawBlocks).toEqual([]);

      // Should apply fallback for missing profile
      expect(result.profile).toBeDefined();
      expect(result.profile.goals).toEqual([]);
      expect(result.profile.aspirations).toEqual([]);
      expect(result.profile.personalValues).toEqual([]);
      expect(result.profile.strengths).toEqual([]);
      expect(result.profile.interests).toEqual([]);
      expect(result.profile.languages).toEqual([]);

      expect(result.confidence).toBe(0.3); // Low confidence due to no content
    });
  });
});
