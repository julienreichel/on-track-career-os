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
 * Unit tests for ai.generateStarStory Lambda function
 * Tests the actual implementation with mocked Bedrock responses
 */
describe('ai.generateStarStory', () => {
  let handler: (event: { arguments: { sourceText: string } }) => Promise<string>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set environment variable for MODEL_ID
    process.env.MODEL_ID = 'amazon.nova-lite-v1:0';

    // Get the mock send function
    const clientInstance = new BedrockRuntimeClient();
    mockSend = clientInstance.send as ReturnType<typeof vi.fn>;

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/generateStarStory');
    handler = module.handler;
  });

  afterEach(() => {
    vi.resetModules();
  });

  const mockExperienceText = `
As a Senior Software Engineer at TechCorp, I led the migration of our monolithic application
to microservices architecture. The team was struggling with deployment bottlenecks and scaling
issues. I designed and implemented a service-oriented architecture using Docker and Kubernetes,
which reduced deployment time by 70% and improved system reliability to 99.9% uptime.
  `.trim();

  /**
   * Mock AI response generator that creates STAR story from experience text
   */
  const generateMockStarStory = (sourceText: string) => {
    // In a real scenario, the AI would analyze the text
    // For testing, we provide a structured response
    if (sourceText.includes('TechCorp')) {
      return {
        situation:
          'The team was struggling with deployment bottlenecks and scaling issues in a monolithic application at TechCorp.',
        task: 'Design and implement a solution to improve deployment efficiency and system scalability.',
        action:
          'Led the migration to microservices architecture using Docker and Kubernetes, implementing a service-oriented design.',
        result: 'Reduced deployment time by 70% and improved system reliability to 99.9% uptime.',
      };
    }
    return {
      situation: 'Context extracted from the provided experience',
      task: 'Objective identified from the experience',
      action: 'Steps taken as described in the experience',
      result: 'Outcome achieved from the experience',
    };
  };

  describe('Handler Integration Tests', () => {
    it('should successfully generate STAR story from experience text', async () => {
      // Mock Bedrock to generate STAR story
      mockSend.mockImplementationOnce(async () => {
        const mockResponse = generateMockStarStory(mockExperienceText);

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
        arguments: { sourceText: mockExperienceText },
      });

      const parsed = JSON.parse(result);
      expect(parsed.situation).toContain('TechCorp');
      expect(parsed.task).toContain('deployment efficiency');
      expect(parsed.action).toContain('microservices');
      expect(parsed.result).toContain('70%');
      expect(typeof parsed.situation).toBe('string');
      expect(typeof parsed.task).toBe('string');
      expect(typeof parsed.action).toBe('string');
      expect(typeof parsed.result).toBe('string');
    });

    it('should apply fallbacks for missing fields', async () => {
      const incompleteResponse = {
        situation: 'Working on a project',
        task: '', // Empty string
        // Missing action and result
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: JSON.stringify(incompleteResponse) }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: mockExperienceText },
      });

      const parsed = JSON.parse(result);
      expect(parsed.situation).toBe('Working on a project');
      expect(parsed.task).toBe('No task provided'); // Fallback for empty string
      expect(parsed.action).toBe('No action provided'); // Fallback for missing field
      expect(parsed.result).toBe('No result provided'); // Fallback for missing field
    });

    it('should handle short experience text', async () => {
      const shortText = 'Implemented a new feature that increased user engagement.';

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [
                  {
                    text: JSON.stringify({
                      situation: 'Working on improving user engagement',
                      task: 'Implement a new feature',
                      action: 'Developed and deployed the feature',
                      result: 'Increased user engagement',
                    }),
                  },
                ],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: shortText },
      });

      const parsed = JSON.parse(result);
      expect(parsed.situation).toBeTruthy();
      expect(parsed.task).toBeTruthy();
      expect(parsed.action).toBeTruthy();
      expect(parsed.result).toBeTruthy();
    });

    it('should handle all fields as empty strings with fallbacks', async () => {
      const emptyResponse = {
        situation: '',
        task: '',
        action: '',
        result: '',
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: JSON.stringify(emptyResponse) }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: 'Some text' },
      });

      const parsed = JSON.parse(result);
      expect(parsed.situation).toBe('No situation provided');
      expect(parsed.task).toBe('No task provided');
      expect(parsed.action).toBe('No action provided');
      expect(parsed.result).toBe('No result provided');
    });

    it('should preserve non-empty fields while applying fallbacks to empty ones', async () => {
      const mixedResponse = {
        situation: 'Valid situation',
        task: '', // Empty - should get fallback
        action: 'Valid action',
        result: undefined, // Missing - should get fallback
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: JSON.stringify(mixedResponse) }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: 'Some text' },
      });

      const parsed = JSON.parse(result);
      expect(parsed.situation).toBe('Valid situation');
      expect(parsed.task).toBe('No task provided');
      expect(parsed.action).toBe('Valid action');
      expect(parsed.result).toBe('No result provided');
    });
  });
});
