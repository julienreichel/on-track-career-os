import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(() => ({
    send: mockSend,
  })),
  InvokeModelCommand: vi.fn((input) => ({ input })),
}));

describe('ai.generateAchievementsAndKpis', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/generateAchievementsAndKpis');
    handler = module.handler;
  });

  describe('Handler Integration Tests', () => {
    it('should successfully generate achievements and KPIs from STAR story', async () => {
      const starStory = {
        situation: 'The team was struggling with deployment bottlenecks',
        task: 'Improve deployment efficiency and system scalability',
        action: 'Led migration to microservices architecture using Docker and Kubernetes',
        result: 'Reduced deployment time by 70% and improved system reliability to 99.9% uptime',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      achievements: [
                        'Led successful migration to microservices architecture',
                        'Reduced deployment time by 70%',
                        'Improved system reliability to 99.9% uptime',
                      ],
                      kpiSuggestions: [
                        'Deployment time reduction: 70%',
                        'System uptime: 99.9%',
                        'Service independence: 100% decoupled services',
                      ],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toBeDefined();
      expect(result.achievements).toHaveLength(3);
      expect(result.achievements[0]).toBe('Led successful migration to microservices architecture');
      expect(result.kpiSuggestions).toBeDefined();
      expect(result.kpiSuggestions).toHaveLength(3);
      expect(result.kpiSuggestions[0]).toContain('70%');
    });

    it('should handle qualitative KPIs when no numbers are present', async () => {
      const starStory = {
        situation: 'Team morale was low due to unclear processes',
        task: 'Improve team collaboration and communication',
        action: 'Implemented daily standups and retrospectives',
        result: 'Team communication improved and morale increased',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      achievements: [
                        'Established daily standup meetings',
                        'Implemented retrospective process',
                        'Improved team communication',
                      ],
                      kpiSuggestions: [
                        'Team communication effectiveness',
                        'Meeting attendance rate',
                        'Team morale improvement',
                      ],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toHaveLength(3);
      expect(result.kpiSuggestions).toHaveLength(3);
      expect(result.kpiSuggestions[0]).toBe('Team communication effectiveness');
    });

    it('should apply fallbacks for missing achievements field', async () => {
      const starStory = {
        situation: 'Test situation',
        task: 'Test task',
        action: 'Test action',
        result: 'Test result',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      // Missing achievements field
                      kpiSuggestions: ['KPI 1', 'KPI 2'],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toBeDefined();
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0]).toBe('Successfully completed project');
      expect(result.kpiSuggestions).toEqual(['KPI 1', 'KPI 2']);
    });

    it('should apply fallbacks for missing kpiSuggestions field', async () => {
      const starStory = {
        situation: 'Test situation',
        task: 'Test task',
        action: 'Test action',
        result: 'Test result',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      achievements: ['Achievement 1', 'Achievement 2'],
                      // Missing kpiSuggestions field
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toEqual(['Achievement 1', 'Achievement 2']);
      expect(result.kpiSuggestions).toBeDefined();
      expect(result.kpiSuggestions).toHaveLength(2);
      expect(result.kpiSuggestions[0]).toBe('Project success metrics');
    });

    it('should apply fallbacks when both fields are empty arrays', async () => {
      const starStory = {
        situation: 'Test situation',
        task: 'Test task',
        action: 'Test action',
        result: 'Test result',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      achievements: [],
                      kpiSuggestions: [],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0]).toBe('Successfully completed project');
      expect(result.kpiSuggestions).toHaveLength(2);
      expect(result.kpiSuggestions[0]).toBe('Project completion rate');
    });

    it('should filter out empty strings from arrays', async () => {
      const starStory = {
        situation: 'Test situation',
        task: 'Test task',
        action: 'Test action',
        result: 'Test result',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      achievements: ['Valid achievement', '', '  ', 'Another achievement'],
                      kpiSuggestions: ['Valid KPI', '', 'Another KPI'],
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toHaveLength(2);
      expect(result.achievements).toEqual(['Valid achievement', 'Another achievement']);
      expect(result.kpiSuggestions).toHaveLength(2);
      expect(result.kpiSuggestions).toEqual(['Valid KPI', 'Another KPI']);
    });

    it('should support snake_case field names from AI response', async () => {
      const starStory = {
        situation: 'Test situation',
        task: 'Test task',
        action: 'Test action',
        result: 'Test result',
      };

      mockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      achievements: ['Achievement 1'],
                      kpi_suggestions: ['KPI 1', 'KPI 2'], // snake_case
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const resultString = await handler({
        arguments: { starStory },
      });
      const result = JSON.parse(resultString);

      expect(result.achievements).toEqual(['Achievement 1']);
      expect(result.kpiSuggestions).toEqual(['KPI 1', 'KPI 2']);
    });
  });
});
