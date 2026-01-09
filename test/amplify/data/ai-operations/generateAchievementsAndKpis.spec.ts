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

  /**
   * Mock AI response generator that simulates achievement/KPI extraction
   * Extracts key terms and metrics from the STAR story input
   */
  const generateMockResponse = (starStory: {
    situation: string;
    task: string;
    action: string;
    result: string;
  }) => {
    // Extract numbers from result for quantitative KPIs
    const numbers = starStory.result.match(/\d+\.?\d*%?/g) || [];

    // Extract key action words
    const actionWords =
      starStory.action.match(
        /\b(Led|Implemented|Created|Improved|Reduced|Increased|Developed|Established|Managed)\w*/gi
      ) || [];

    // Generate achievements based on action and result
    const achievements = [
      ...actionWords.slice(0, 2).map((word) => `${word} successfully`),
      starStory.result
        .split(/[,.]/)
        .filter((s) => s.trim())[0]
        ?.trim() || 'Completed project successfully',
    ].slice(0, 3);

    // Generate KPIs - use numbers if available, otherwise qualitative
    const kpiSuggestions =
      numbers.length > 0
        ? numbers.map((num) => `Metric improvement: ${num}`)
        : [
            'Team effectiveness improved',
            'Process efficiency increased',
            'Quality metrics improved',
          ].slice(0, 2);

    return {
      achievements,
      kpiSuggestions: kpiSuggestions.slice(0, 3),
    };
  };

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
                    text: JSON.stringify(generateMockResponse(starStory)),
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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

      // Verify input was used - result should contain data from input
      expect(result.achievements).toBeDefined();
      expect(result.achievements.length).toBeGreaterThan(0);

      // Verify the mock extracted keywords from the input
      const achievementText = result.achievements.join(' ');
      expect(achievementText).toMatch(/Led|migration|Reduced/i);

      expect(result.kpiSuggestions).toBeDefined();
      expect(result.kpiSuggestions.length).toBeGreaterThan(0);

      // Verify numbers from input are captured
      const kpiText = result.kpiSuggestions.join(' ');
      expect(kpiText).toMatch(/70|99\.9/);
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
                    text: JSON.stringify(generateMockResponse(starStory)),
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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

      expect(result.achievements).toBeDefined();
      expect(result.achievements.length).toBeGreaterThan(0);

      // Verify input was used - achievements should reference the action
      const achievementText = result.achievements.join(' ');
      expect(achievementText).toMatch(/Implemented|standups|retrospectives/i);

      // Should have qualitative KPIs (no numbers in input)
      expect(result.kpiSuggestions).toBeDefined();
      expect(result.kpiSuggestions.length).toBeGreaterThan(0);
      expect(result.kpiSuggestions[0]).toMatch(/effectiveness|efficiency|improved/i);
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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

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
      const result = resultString as { achievements: string[]; kpiSuggestions: string[] };

      expect(result.achievements).toEqual(['Achievement 1']);
      expect(result.kpiSuggestions).toEqual(['KPI 1', 'KPI 2']);
    });
  });
});
