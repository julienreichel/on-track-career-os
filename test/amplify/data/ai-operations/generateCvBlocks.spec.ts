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
 * Unit tests for ai.generateCvBlocks Lambda function
 * Tests the actual implementation with mocked Bedrock responses
 */
describe('ai.generateCvBlocks', () => {
  let handler: any;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set environment variable for MODEL_ID
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    // Get the mock send function
    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/generateCvBlocks');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  // Mock input data
  const mockUserProfile = {
    id: 'user-1',
    fullName: 'Jane Smith',
    headline: 'Senior Product Manager',
    location: 'New York, NY',
    seniorityLevel: 'Senior',
    goals: ['Lead product strategy', 'Build scalable platforms'],
    aspirations: ['VP of Product'],
    personalValues: ['Innovation', 'Collaboration'],
    strengths: ['Strategic thinking', 'Cross-functional leadership'],
  };

  const mockExperiences = [
    {
      id: 'exp-1',
      title: 'Senior Product Manager',
      company: 'TechCorp',
      startDate: '2020-01-01',
      endDate: '2023-12-01',
      location: 'San Francisco, CA',
      responsibilities: ['Led product roadmap', 'Managed 5 engineers'],
      tasks: ['Defined OKRs', 'Launched 3 major features'],
    },
    {
      id: 'exp-2',
      title: 'Product Manager',
      company: 'StartupCo',
      startDate: '2018-06-01',
      endDate: '2019-12-01',
      location: 'Boston, MA',
      responsibilities: ['Product strategy', 'User research'],
      tasks: ['Built MVP', 'Grew user base 10x'],
    },
  ];

  const mockStories = [
    {
      experienceId: 'exp-1',
      situation: 'Legacy system causing customer churn',
      task: 'Redesign platform architecture',
      action: 'Led cross-functional team through 6-month rebuild',
      result: 'Reduced churn by 40%, improved NPS by 25 points',
      achievements: ['40% churn reduction', '25-point NPS improvement'],
      kpiSuggestions: ['Customer retention rate: 90%', 'NPS: 65'],
    },
  ];

  const mockJobDescription = `Senior Product Manager position at FinTech company.
Requirements: 5+ years PM experience, B2B SaaS background, team leadership.`;

  /**
   * Generate mock CV sections based on input data
   */
  const generateMockCvResponse = (input: Record<string, unknown>) => {
    const profile = input.userProfile as Record<string, unknown>;
    const experiences = (input.selectedExperiences as Record<string, unknown>[]) || [];
    const hasJobDescription = !!input.jobDescription;

    const sections = [];

    // Summary section
    sections.push({
      type: 'summary',
      title: null,
      content: `${profile.fullName} is a ${profile.headline} with ${experiences.length} years of experience. 
${hasJobDescription ? 'Expertise in B2B SaaS and team leadership.' : 'Proven track record in product management.'}`,
      experienceId: null,
    });

    // Experience sections (one per experience)
    experiences.forEach((exp) => {
      const expData = exp as Record<string, unknown>;
      sections.push({
        type: 'experience',
        title: `${expData.title} at ${expData.company}`,
        content: `${expData.startDate} - ${expData.endDate}\n${(expData.responsibilities as string[])?.join(', ')}`,
        experienceId: expData.id,
      });
    });

    // Skills section
    if (input.skills && Array.isArray(input.skills) && input.skills.length > 0) {
      sections.push({
        type: 'skills',
        title: 'Technical Skills',
        content: input.skills.join(', '),
        experienceId: null,
      });
    }

    // Languages section
    if (input.languages && Array.isArray(input.languages) && input.languages.length > 0) {
      sections.push({
        type: 'languages',
        title: 'Languages',
        content: input.languages.join(', '),
        experienceId: null,
      });
    }

    return { sections };
  };

  describe('Handler Integration Tests', () => {
    it('should generate CV with all sections when complete input provided', async () => {
      mockSend.mockImplementationOnce(async () => {
        const commandCall = (vi.mocked(InvokeModelCommand).mock.calls[0] as unknown[])[0] as {
          body: string;
        };
        const requestBody = JSON.parse(commandCall.body);
        const userPrompt = requestBody.messages[0].content[0].text;

        // Parse input from prompt
        const profileMatch = userPrompt.match(/User profile:\n([\s\S]*?)\n\nSelected experiences:/);
        const input = profileMatch
          ? {
              userProfile: mockUserProfile,
              selectedExperiences: mockExperiences,
              skills: ['Product Strategy', 'Agile', 'SQL'],
              languages: ['English', 'Spanish'],
            }
          : {};

        const mockResponse = generateMockCvResponse(input);
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
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
          stories: mockStories,
          skills: ['Product Strategy', 'Agile', 'SQL'],
          languages: ['English', 'Spanish'],
          certifications: ['Certified Scrum Master'],
          interests: ['Mentoring', 'Public Speaking'],
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections).toBeDefined();
      expect(Array.isArray(parsed.sections)).toBe(true);
      expect(parsed.sections.length).toBeGreaterThan(0);

      // Verify summary section
      const summarySection = parsed.sections.find((s: { type: string }) => s.type === 'summary');
      expect(summarySection).toBeDefined();
      expect(summarySection.content).toContain(mockUserProfile.fullName);

      // Verify experience sections
      const experienceSections = parsed.sections.filter(
        (s: { type: string }) => s.type === 'experience'
      );
      expect(experienceSections.length).toBeGreaterThan(0);
    });

    it('should tailor CV when job description is provided', async () => {
      mockSend.mockImplementationOnce(async () => {
        const commandCall = (vi.mocked(InvokeModelCommand).mock.calls[0] as unknown[])[0] as {
          body: string;
        };
        const requestBody = JSON.parse(commandCall.body);
        const userPrompt = requestBody.messages[0].content[0].text;

        // Check if job description is in the prompt
        const hasJobDescription = userPrompt.includes(mockJobDescription);

        const mockResponse = generateMockCvResponse({
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
          jobDescription: hasJobDescription ? mockJobDescription : null,
        });

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
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
          jobDescription: mockJobDescription,
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections).toBeDefined();

      // Verify that content reflects job-specific tailoring
      const summarySection = parsed.sections.find((s: { type: string }) => s.type === 'summary');
      expect(summarySection?.content).toContain('B2B SaaS');
    });

    it('should adjust length based on number of experiences (many experiences)', async () => {
      const manyExperiences = Array.from({ length: 8 }, (_, i) => ({
        id: `exp-${i}`,
        title: `Position ${i}`,
        company: `Company ${i}`,
        startDate: '2020-01-01',
        endDate: '2021-01-01',
        responsibilities: [`Responsibility ${i}`],
        tasks: [`Task ${i}`],
      }));

      mockSend.mockImplementationOnce(async () => {
        const mockResponse = {
          sections: manyExperiences.map((exp, i) => ({
            type: 'experience',
            title: `${exp.title} at ${exp.company}`,
            content: `Brief summary ${i}`, // Shorter content for many experiences
            experienceId: exp.id,
          })),
        };

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
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: manyExperiences,
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections).toBeDefined();
      expect(parsed.sections.length).toBe(8);

      // Verify shorter content (implementation would ensure this via prompt)
      // Test just validates structure
      parsed.sections.forEach((section: { content: string }) => {
        expect(section.content.length).toBeLessThan(500);
      });
    });

    it('should validate section types and map invalid types', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      sections: [
                        {
                          type: 'summary',
                          content: 'Valid summary',
                        },
                        {
                          type: 'profile', // Invalid type, should map to 'summary'
                          content: 'Should be mapped',
                        },
                        {
                          type: 'work', // Invalid type, should map to 'experience'
                          content: 'Work experience',
                        },
                        {
                          type: 'unknown', // Invalid type, should map to 'custom'
                          content: 'Custom content',
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections).toHaveLength(4);
      expect(parsed.sections[0].type).toBe('summary');
      expect(parsed.sections[1].type).toBe('summary'); // Mapped from 'profile'
      expect(parsed.sections[2].type).toBe('experience'); // Mapped from 'work'
      expect(parsed.sections[3].type).toBe('custom'); // Mapped from 'unknown'
    });

    it('should drop sections missing required fields', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      sections: [
                        {
                          type: 'summary',
                          content: 'Valid section',
                        },
                        {
                          type: 'experience',
                          // Missing content field - should be dropped
                        },
                        {
                          // Missing type field - should be dropped
                          content: 'No type specified',
                        },
                        {
                          type: 'skills',
                          content: 'Another valid section',
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
        },
      });

      const parsed = JSON.parse(result);
      // Only 2 valid sections should remain
      expect(parsed.sections).toHaveLength(2);
      expect(parsed.sections[0].type).toBe('summary');
      expect(parsed.sections[1].type).toBe('skills');
    });

    it('should truncate extremely verbose content', async () => {
      const veryLongContent = 'x'.repeat(6000); // Exceeds MAX_SECTION_LENGTH (5000)

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      sections: [
                        {
                          type: 'summary',
                          content: veryLongContent,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections).toHaveLength(1);
      expect(parsed.sections[0].content.length).toBeLessThanOrEqual(5003); // 5000 + '...'
      expect(parsed.sections[0].content).toMatch(/\.\.\.$/);
    });

    it('should return empty sections array when sections field is missing', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      // Missing sections field entirely
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: {
          userProfile: mockUserProfile,
          selectedExperiences: mockExperiences,
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections).toEqual([]);
    });
  });
});
