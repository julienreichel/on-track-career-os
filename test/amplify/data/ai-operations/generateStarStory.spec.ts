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
   * Mock AI response generator that creates STAR stories from experience text
   * Now returns text with markdown headers instead of JSON
   */
  const generateMockStarStoryText = (sourceText: string) => {
    // In a real scenario, the AI would analyze the text
    // For testing, we provide a structured text response
    if (sourceText.includes('TechCorp')) {
      return `## title:
TechCorp Deployment Win

## situation:
The team was struggling with deployment bottlenecks and scaling issues in a monolithic application at TechCorp.

## task:
Design and implement a solution to improve deployment efficiency and system scalability.

## action:
Led the migration to microservices architecture using Docker and Kubernetes, implementing a service-oriented design.

## result:
Reduced deployment time by 70% and improved system reliability to 99.9% uptime.`;
    }
    return `## title:
General Achievement

## situation:
Context extracted from the provided experience

## task:
Objective identified from the experience

## action:
Steps taken as described in the experience

## result:
Outcome achieved from the experience`;
  };

  describe('Handler Integration Tests', () => {
    it('should successfully generate STAR story from experience text', async () => {
      // Mock Bedrock to generate STAR story text
      mockSend.mockImplementationOnce(async () => {
        const mockResponse = generateMockStarStoryText(mockExperienceText);

        return {
          body: new TextEncoder().encode(
            JSON.stringify({
              output: {
                message: {
                  content: [{ text: mockResponse }],
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
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      const story = parsed[0];
      expect(story.title).toBe('TechCorp Deployment Win');
      expect(story.situation).toContain('TechCorp');
      expect(story.task).toContain('deployment efficiency');
      expect(story.action).toContain('microservices');
      expect(story.result).toContain('70%');
      expect(typeof story.title).toBe('string');
      expect(typeof story.situation).toBe('string');
      expect(typeof story.task).toBe('string');
      expect(typeof story.action).toBe('string');
      expect(typeof story.result).toBe('string');
    });

    it('should apply fallbacks for missing fields', async () => {
      const incompleteText = `## title:
Custom Story Title

## situation:
Working on a project

## task:

## action:

## result:`;

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: incompleteText }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: mockExperienceText },
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      const story = parsed[0];
      expect(story.title).toBe('Custom Story Title');
      expect(story.situation).toBe('Working on a project');
      expect(story.task).toBe('No task provided'); // Fallback for empty string
      expect(story.action).toBe('No action provided'); // Fallback for missing field
      expect(story.result).toBe('No result provided'); // Fallback for missing field
    });

    it('should handle short experience text', async () => {
      const shortText = 'Implemented a new feature that increased user engagement.';

      const shortTextResponse = `## title:
Engagement Booster

## situation:
Working on improving user engagement

## task:
Implement a new feature

## action:
Developed and deployed the feature

## result:
Increased user engagement`;

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: shortTextResponse }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: shortText },
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      const story = parsed[0];
      expect(story.situation).toBeTruthy();
      expect(story.task).toBeTruthy();
      expect(story.action).toBeTruthy();
      expect(story.result).toBeTruthy();
    });

    it('should support inline heading titles without explicit markers', async () => {
      const inlineHeadingResponse = `## Registration System Redesign Success
**Boosted Enterprise Adoption**

## situation:
I was tasked with revamping our Registration System to improve its adoption rate and to secure more enterprise contracts.

## task:
I needed to redesign the Registration System to significantly increase its adoption rate and attract more enterprise clients.

## action:
I led the redesign focusing on user experience and collaborated closely with Product and Design.

## result:
I increased adoption from 5% to 60%, securing over $1M in enterprise contracts.

---

## Support Incident Volume Reduction
Streamlined Support Processes

## situation:
I faced a challenge of high support incident volume, impacting customer satisfaction.

## task:
I had to reduce the incident volume by improving processes and the platform.

## action:
I streamlined workflows with QA and Operations and introduced a new incident platform.

## result:
I reduced incident volume by 40%, improving productivity and satisfaction.`;

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: inlineHeadingResponse }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: mockExperienceText },
      });

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].title).toBe('Registration System Redesign Success');
      expect(parsed[1].title).toBe('Support Incident Volume Reduction');
      expect(parsed[0].situation).toContain('revamping our Registration System');
      expect(parsed[1].result).toContain('reduced incident volume by 40%');
    });

    it('should handle all fields as empty strings with fallbacks', async () => {
      const emptyText = `## title:

## situation:

## task:

## action:

## result:`;

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: emptyText }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: 'Some text' },
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      const story = parsed[0];
      // When all fields are empty, the parser can't extract a valid story
      // so it returns the "unable to extract" fallback
      expect(story.situation).toBe('Unable to extract situation from text');
      expect(story.task).toBe('Unable to extract task from text');
      expect(story.action).toBe('Unable to extract action from text');
      expect(story.result).toBe('Unable to extract result from text');
    });

    it('should preserve non-empty fields while applying fallbacks to empty ones', async () => {
      const mixedText = `## title:
Customer Support Win

## situation:
Valid situation

## task:

## action:
Valid action

## result:`;

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: mixedText }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: 'Some text' },
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      const story = parsed[0];
      expect(story.title).toBe('Customer Support Win');
      expect(story.situation).toBe('Valid situation');
      expect(story.task).toBe('No task provided');
      expect(story.action).toBe('Valid action');
      expect(story.result).toBe('No result provided');
    });

    it('should handle multiple STAR stories in one response', async () => {
      const multipleStoriesText = `## situation:
First project context

## task:
First project task

## action:
First project actions

## result:
First project results

## situation:
Second project context

## task:
Second project task

## action:
Second project actions

## result:
Second project results`;

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            output: {
              message: {
                content: [{ text: multipleStoriesText }],
              },
            },
          })
        ),
      });

      const result = await handler({
        arguments: { sourceText: 'Multiple experiences text' },
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);

      expect(parsed[0].situation).toBe('First project context');
      expect(parsed[0].task).toBe('First project task');

      expect(parsed[1].situation).toBe('Second project context');
      expect(parsed[1].task).toBe('Second project task');
    });
  });
});
