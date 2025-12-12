import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  PersonalCanvasOutput,
  PersonalCanvasInput,
} from '@amplify/data/ai-operations/generatePersonalCanvas';

// Mock AWS SDK
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(() => ({
    send: mockSend,
  })),
  InvokeModelCommand: vi.fn((input) => ({ input })),
}));

describe('ai.generatePersonalCanvas', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/generatePersonalCanvas');
    handler = module.handler;
  });

  /**
   * Mock AI response generator that creates realistic canvas output
   * Extracts insights from user profile, experiences, and stories
   * Uses official Business Model Canvas 9 blocks
   */
  const generateMockResponse = (input: PersonalCanvasInput): PersonalCanvasOutput => {
    // Extract skills and technologies from experiences
    const skills =
      input.experiences.flatMap((exp) => [exp.title || 'Professional role']).slice(0, 3) || [];

    // Extract value props from stories
    const valueProps =
      input.stories.map((story) => story.result || 'Delivered successful outcomes').slice(0, 3) ||
      [];

    // Extract customer segments from experiences
    const customerSegs =
      input.experiences.map((exp) => exp.company || 'Target companies').slice(0, 3) || [];

    return {
      customerSegments: customerSegs.length > 0 ? customerSegs : ['Tech companies', 'Startups'],
      valueProposition: valueProps.length > 0 ? valueProps : ['Experienced professional'],
      channels: ['LinkedIn', 'Job boards', 'Professional networks'],
      customerRelationships: ['Professional networking', 'Direct applications', 'Referrals'],
      keyActivities: skills.length > 0 ? skills : ['Core professional activities'],
      keyResources: ['Technical skills', 'Experience', 'Professional network'],
      keyPartners: ['Mentors', 'Recruiters', 'Professional associations'],
      costStructure: ['Time investment', 'Professional development', 'Certifications'],
      revenueStreams: ['Salary', 'Benefits', 'Stock options'],
    };
  };

  describe('Handler Integration Tests', () => {
    it('should successfully generate Personal Canvas from complete user data', async () => {
      const input = {
        profile: {
          fullName: 'John Doe',
          headline: 'Senior Software Engineer',
          summary: 'Experienced engineer specializing in cloud architecture',
        },
        experiences: [
          {
            title: 'Senior Software Engineer',
            company: 'TechCorp',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            responsibilities: ['Architected microservices', 'Led team of 5 engineers'],
            tasks: ['Code reviews', 'System design'],
          },
          {
            title: 'Software Engineer',
            company: 'StartupInc',
            startDate: '2018-06-01',
            endDate: '2019-12-31',
            responsibilities: ['Built web application'],
            tasks: ['Frontend development', 'API integration'],
          },
        ],
        stories: [
          {
            situation: 'System reliability issues',
            task: 'Improve uptime',
            action: 'Implemented monitoring and auto-scaling',
            result: 'Achieved 99.9% uptime',
            achievements: ['Improved system reliability'],
            kpiSuggestions: ['Uptime: 99.9%'],
          },
          {
            situation: 'Slow deployment process',
            task: 'Accelerate releases',
            action: 'Built CI/CD pipeline',
            result: 'Reduced deployment time by 70%',
            achievements: ['Automated deployments'],
            kpiSuggestions: ['Deployment time: -70%'],
          },
        ],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify(generateMockResponse(input)),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result).toBeDefined();
      expect(result.customerSegments).toBeDefined();
      expect(Array.isArray(result.customerSegments)).toBe(true);

      expect(result.valueProposition).toBeDefined();
      expect(Array.isArray(result.valueProposition)).toBe(true);
      expect(result.valueProposition.length).toBeGreaterThan(0);

      expect(result.channels).toBeDefined();
      expect(Array.isArray(result.channels)).toBe(true);

      expect(result.customerRelationships).toBeDefined();
      expect(Array.isArray(result.customerRelationships)).toBe(true);

      expect(result.keyActivities).toBeDefined();
      expect(Array.isArray(result.keyActivities)).toBe(true);

      expect(result.keyResources).toBeDefined();
      expect(result.keyPartners).toBeDefined();
      expect(result.costStructure).toBeDefined();
      expect(result.revenueStreams).toBeDefined();

      // Verify all arrays contain strings
      const allFields = [
        ...result.customerSegments,
        ...result.valueProposition,
        ...result.channels,
        ...result.customerRelationships,
        ...result.keyActivities,
        ...result.keyResources,
        ...result.keyPartners,
        ...result.costStructure,
        ...result.revenueStreams,
      ];
      expect(allFields.every((item) => typeof item === 'string')).toBe(true);
    });

    it('should handle minimal user data with fallbacks', async () => {
      const input = {
        profile: {
          fullName: 'Jane Smith',
        },
        experiences: [],
        stories: [],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      customer_segments: [],
                      value_proposition: [],
                      channels: [],
                      customer_relationships: [],
                      key_activities: [],
                      key_resources: [],
                      key_partners: [],
                      cost_structure: [],
                      revenue_streams: [],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      // All fields should have fallback values
      expect(result.customerSegments.length).toBeGreaterThan(0);
      expect(result.valueProposition.length).toBeGreaterThan(0);
      expect(result.channels.length).toBeGreaterThan(0);
      expect(result.customerRelationships.length).toBeGreaterThan(0);
      expect(result.keyActivities.length).toBeGreaterThan(0);
      expect(result.keyResources.length).toBeGreaterThan(0);
      expect(result.keyPartners.length).toBeGreaterThan(0);
      expect(result.costStructure.length).toBeGreaterThan(0);
      expect(result.revenueStreams.length).toBeGreaterThan(0);
    });

    it('should support snake_case field names from AI response', async () => {
      const input = {
        profile: { fullName: 'Test User' },
        experiences: [{ title: 'Engineer', company: 'TestCo' }],
        stories: [],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      customer_segments: ['Tech companies'],
                      value_proposition: ['Strong technical skills'],
                      channels: ['LinkedIn'],
                      customer_relationships: ['Professional networking'],
                      key_activities: ['Software development'],
                      key_resources: ['Technical skills'],
                      key_partners: ['Mentors'],
                      cost_structure: ['Time investment'],
                      revenue_streams: ['Salary'],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result.customerSegments).toEqual(['Tech companies']);
      expect(result.valueProposition).toEqual(['Strong technical skills']);
      expect(result.channels).toEqual(['LinkedIn']);
      expect(result.keyActivities).toEqual(['Software development']);
    });

    it('should filter out empty strings from arrays', async () => {
      const input = {
        profile: { fullName: 'Test User' },
        experiences: [],
        stories: [],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      customerSegments: ['Segment 1', ''],
                      valueProposition: ['Valid value', '', '  ', 'Another value'],
                      channels: ['Channel 1'],
                      customerRelationships: ['Relationship 1'],
                      keyActivities: ['', 'Valid activity'],
                      keyResources: ['Resource 1', ''],
                      keyPartners: ['Partner 1'],
                      costStructure: ['Cost 1'],
                      revenueStreams: ['Revenue 1'],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result.customerSegments).toEqual(['Segment 1']);
      expect(result.valueProposition).toEqual(['Valid value', 'Another value']);
      expect(result.keyActivities).toEqual(['Valid activity']);
      expect(result.keyResources).toEqual(['Resource 1']);
    });

    it('should handle experiences with missing optional fields', async () => {
      const input = {
        profile: {},
        experiences: [
          {
            title: 'Engineer',
            // Missing company, dates, responsibilities, tasks
          },
          {
            company: 'TechCorp',
            // Missing title
          },
        ],
        stories: [],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify(generateMockResponse(input)),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result).toBeDefined();
      expect(result.customerSegments).toBeDefined();
      expect(result.valueProposition).toBeDefined();
      expect(result.keyActivities).toBeDefined();
    });

    it('should handle stories with missing optional fields', async () => {
      const input = {
        profile: { fullName: 'User' },
        experiences: [],
        stories: [
          {
            situation: 'Test situation',
            task: 'Test task',
            // Missing action, result, achievements, kpiSuggestions
          },
        ],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify(generateMockResponse(input)),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result).toBeDefined();
      expect(result.valueProposition.length).toBeGreaterThan(0);
    });

    it('should generate canvas from mixed complete and incomplete data', async () => {
      const input = {
        profile: {
          fullName: 'Mixed User',
          headline: 'Professional',
          // Missing summary
        },
        experiences: [
          {
            title: 'Role 1',
            company: 'Company 1',
            responsibilities: ['Task 1'],
          },
          {
            // Minimal experience
            title: 'Role 2',
          },
        ],
        stories: [
          {
            situation: 'Full story',
            task: 'Task',
            action: 'Action',
            result: 'Result',
            achievements: ['Achievement'],
            kpiSuggestions: ['KPI'],
          },
          {
            // Partial story
            situation: 'Partial',
            result: 'Outcome',
          },
        ],
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify(generateMockResponse(input)),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result).toBeDefined();
      expect(result.customerSegments.length).toBeGreaterThan(0);
      expect(result.valueProposition.length).toBeGreaterThan(0);
      expect(result.keyActivities.length).toBeGreaterThan(0);

      // Verify output derives from input data
      const hasExperienceData = result.customerSegments.some((seg) =>
        ['Company 1', 'Company 2', 'Tech companies', 'Startups'].some((exp) => seg.includes(exp))
      );
      expect(hasExperienceData).toBe(true);
    });
  });
});
