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
  let handler: (event: { arguments: { cvText: string; language: string } }) => Promise<unknown>;
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

    return {
      profile: {
        fullName: fullName || '',
        headline: headline || '',
        location: location || '',
        seniorityLevel: headline?.includes('Senior') ? 'Senior' : '',
        primaryEmail: '',
        primaryPhone: '',
        workPermitInfo: '',
        socialLinks: [],
        aspirations: [],
        personalValues: [],
        strengths: [],
        interests: [],
        skills,
        certifications,
        languages,
      },
      experienceItems: [
        ...experiences.map((rawBlock) => ({
          experienceType: 'work',
          rawBlock,
        })),
        ...education.map((rawBlock) => ({
          experienceType: 'education',
          rawBlock,
        })),
      ],
      rawBlocks: [],
      confidence: 0.78,
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
        void requestBody;
        const mockResponse = generateMockResponse(mockCvText);

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
        arguments: { cvText: mockCvText, language: 'en' },
      });

      const parsed = result as {
        profile: {
          fullName: string;
          headline: string;
          location: string;
          seniorityLevel: string;
          languages: string[];
          skills: string[];
          certifications: string[];
        };
        experienceItems: { experienceType: string; rawBlock: string }[];
        rawBlocks: string[];
        confidence: number;
      };
      expect(parsed.experienceItems).toHaveLength(2);
      expect(parsed.experienceItems[0]?.rawBlock).toContain('TechCorp');
      expect(parsed.experienceItems[1]?.rawBlock).toContain('MIT');
      expect(parsed.profile.skills).toHaveLength(3);
      expect(parsed.profile.skills).toContain('JavaScript');
      expect(parsed.profile.certifications).toHaveLength(1);
      expect(parsed.profile.certifications[0]).toContain('AWS Certified');

      // Verify profile information extraction
      expect(parsed.profile).toBeDefined();
      expect(parsed.profile.fullName).toBe('John Doe');
      expect(parsed.profile.headline).toBe('Senior Software Engineer');
      expect(parsed.profile.location).toBe('San Francisco, CA');
      expect(parsed.profile.seniorityLevel).toBe('Senior');
      expect(parsed.profile.languages).toContain('English');
      expect(parsed.profile.languages).toContain('Spanish');
    });

    it('should throw when content is not a CV', async () => {
      const nonCvResponse = {
        error: 'Not a CV.',
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: JSON.stringify(nonCvResponse) }],
              },
            },
          })
        ),
      });

      await expect(
        handler({
          arguments: { cvText: 'Invoice #1234', language: 'en' },
        })
      ).rejects.toThrow('Not a CV.');
    });

    it('should throw when model response is invalid JSON', async () => {
      const invalidResponse = {
        output: {
          message: {
            content: [{ text: 'not json' }],
          },
        },
      };

      mockSend
        .mockResolvedValueOnce({
          body: Buffer.from(JSON.stringify(invalidResponse)),
        })
        .mockResolvedValueOnce({
          body: Buffer.from(JSON.stringify(invalidResponse)),
        });

      await expect(
        handler({
          arguments: { cvText: 'Broken response', language: 'en' },
        })
      ).rejects.toThrow('AI cannot produce a stable answer');
    });
    it('should validate output structure and apply operation-specific fallbacks', async () => {
      const mockBedrockResponse = {
        experienceItems: [
          {
            experienceType: 'work',
            rawBlock: 'Some experience',
          },
        ],
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
        arguments: { cvText: mockCvText, language: 'en' },
      });

      const parsed = result as {
        profile: {
          fullName: string;
          aspirations: string[];
          personalValues: string[];
          strengths: string[];
          interests: string[];
          languages: string[];
          skills: string[];
          certifications: string[];
        };
        experienceItems: { experienceType: string; rawBlock: string }[];
        rawBlocks: string[];
        confidence: number;
      };
      expect(parsed.experienceItems).toEqual([
        { experienceType: 'work', rawBlock: 'Some experience' },
      ]);
      // Operation-specific validation fills missing fields
      expect(parsed.rawBlocks).toEqual([]);
      expect(parsed.profile.skills).toEqual([]);
      expect(parsed.profile.certifications).toEqual([]);

      // Verify profile validation
      expect(parsed.profile).toBeDefined();
      expect(parsed.profile.fullName).toBe('Test User');
      expect(parsed.profile.aspirations).toEqual([]);
      expect(parsed.profile.languages).toEqual([]);
    });

    it('should throw when profile and experience items are missing', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      // Missing required fields
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      await expect(
        handler({
          arguments: { cvText: mockCvText, language: 'en' },
        })
      ).rejects.toThrow('ERR_NON_CV_DOCUMENT');
    });

    it('should repair string arrays and invalid experience items', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      profile: {
                        fullName: 'Test User',
                        languages: 'English, Spanish',
                        personalValues: 'Integrity\nCollaboration',
                      },
                      experienceItems: [
                        { experienceType: 'unknown', rawBlock: 'Unclassified block' },
                        { experienceType: 'work', rawBlock: 'Valid work block' },
                      ],
                      rawBlocks: 'Loose block',
                      confidence: 0.6,
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = (await handler({
        arguments: { cvText: mockCvText, language: 'en' },
      })) as {
        profile: { languages: string[]; personalValues: string[] };
        experienceItems: { experienceType: string; rawBlock: string }[];
        rawBlocks: string[];
      };

      expect(result.profile.languages).toEqual(['English', 'Spanish']);
      expect(result.profile.personalValues).toEqual(['Integrity', 'Collaboration']);
      expect(result.experienceItems).toEqual([
        { experienceType: 'work', rawBlock: 'Valid work block' },
      ]);
      expect(result.rawBlocks).toContain('Unclassified block');
      expect(result.rawBlocks).toContain('Loose block');
    });
  });
});
