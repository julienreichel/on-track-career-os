import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PersonalCanvasOutput } from '@amplify/data/ai-operations/generatePersonalCanvas';

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
   */
  const generateMockResponse = (input: {
    profile: { fullName?: string; headline?: string; summary?: string };
    experiences: Array<{ title?: string; company?: string }>;
    stories: Array<{ action?: string; result?: string }>;
  }): PersonalCanvasOutput => {
    // Extract skills and technologies from experiences
    const skills =
      input.experiences.flatMap((exp) => [exp.title || 'Professional role']).slice(0, 3) || [];

    // Extract value props from stories
    const valueProps =
      input.stories
        .map((story) => story.result || 'Delivered successful outcomes')
        .slice(0, 3) || [];

    // Generate target roles from experience titles
    const targetRoles =
      input.experiences.map((exp) => exp.title || 'Professional role').slice(0, 3) || [];

    return {
      valueProposition: valueProps.length > 0 ? valueProps : ['Experienced professional'],
      keyActivities: skills.length > 0 ? skills : ['Core professional activities'],
      strengthsAdvantage: ['Technical expertise', 'Leadership skills'],
      targetRoles: targetRoles.length > 0 ? targetRoles : ['Professional roles'],
      channels: ['LinkedIn', 'Job boards', 'Professional networks'],
      resources: ['Skills', 'Experience', 'Network'],
      careerDirection: ['Growth in current field', 'Leadership opportunities'],
      painRelievers: ['Solve technical challenges', 'Improve team efficiency'],
      gainCreators: ['Drive business value', 'Mentor team members'],
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
      expect(result.valueProposition).toBeDefined();
      expect(Array.isArray(result.valueProposition)).toBe(true);
      expect(result.valueProposition.length).toBeGreaterThan(0);

      expect(result.keyActivities).toBeDefined();
      expect(Array.isArray(result.keyActivities)).toBe(true);

      expect(result.strengthsAdvantage).toBeDefined();
      expect(Array.isArray(result.strengthsAdvantage)).toBe(true);

      expect(result.targetRoles).toBeDefined();
      expect(Array.isArray(result.targetRoles)).toBe(true);

      expect(result.channels).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(result.careerDirection).toBeDefined();
      expect(result.painRelievers).toBeDefined();
      expect(result.gainCreators).toBeDefined();

      // Verify all arrays contain strings
      const allFields = [
        ...result.valueProposition,
        ...result.keyActivities,
        ...result.strengthsAdvantage,
        ...result.targetRoles,
        ...result.channels,
        ...result.resources,
        ...result.careerDirection,
        ...result.painRelievers,
        ...result.gainCreators,
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
                      value_proposition: [],
                      key_activities: [],
                      strengths_advantage: [],
                      target_roles: [],
                      channels: [],
                      resources: [],
                      career_direction: [],
                      pain_relievers: [],
                      gain_creators: [],
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
      expect(result.valueProposition.length).toBeGreaterThan(0);
      expect(result.keyActivities.length).toBeGreaterThan(0);
      expect(result.strengthsAdvantage.length).toBeGreaterThan(0);
      expect(result.targetRoles.length).toBeGreaterThan(0);
      expect(result.channels.length).toBeGreaterThan(0);
      expect(result.resources.length).toBeGreaterThan(0);
      expect(result.careerDirection.length).toBeGreaterThan(0);
      expect(result.painRelievers.length).toBeGreaterThan(0);
      expect(result.gainCreators.length).toBeGreaterThan(0);
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
                      value_proposition: ['Strong technical skills'],
                      key_activities: ['Software development'],
                      strengths_advantage: ['Problem solving'],
                      target_roles: ['Senior Engineer'],
                      channels: ['LinkedIn'],
                      resources: ['Technical skills'],
                      career_direction: ['Technical leadership'],
                      pain_relievers: ['Solve complex problems'],
                      gain_creators: ['Deliver quality software'],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result.valueProposition).toEqual(['Strong technical skills']);
      expect(result.keyActivities).toEqual(['Software development']);
      expect(result.strengthsAdvantage).toEqual(['Problem solving']);
      expect(result.targetRoles).toEqual(['Senior Engineer']);
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
                      valueProposition: ['Valid value', '', '  ', 'Another value'],
                      keyActivities: ['', 'Valid activity'],
                      strengthsAdvantage: ['Strength 1', ''],
                      targetRoles: ['Role 1'],
                      channels: ['Channel 1'],
                      resources: ['Resource 1'],
                      careerDirection: ['Direction 1'],
                      painRelievers: ['Reliever 1'],
                      gainCreators: ['Creator 1'],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({ arguments: input });

      expect(result.valueProposition).toEqual(['Valid value', 'Another value']);
      expect(result.keyActivities).toEqual(['Valid activity']);
      expect(result.strengthsAdvantage).toEqual(['Strength 1']);
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
      expect(result.valueProposition).toBeDefined();
      expect(result.targetRoles).toBeDefined();
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
      expect(result.valueProposition.length).toBeGreaterThan(0);
      expect(result.keyActivities.length).toBeGreaterThan(0);
      expect(result.targetRoles.length).toBeGreaterThan(0);

      // Verify output derives from input data
      const hasExperienceData = result.targetRoles.some((role) =>
        ['Role 1', 'Role 2', 'Professional role'].some((exp) => role.includes(exp))
      );
      expect(hasExperienceData).toBe(true);
    });
  });
});
