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
 * Unit tests for ai.parseCvText Lambda function
 * Tests the actual implementation with mocked Bedrock responses
 */
describe('ai.parseCvText', () => {
  let handler: (event: { arguments: { cv_text: string } }) => Promise<string>;
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
Senior Software Engineer

EXPERIENCE
Senior Software Engineer at TechCorp (2020-2023)
- Led development of cloud-native applications
- Managed team of 5 developers
- Implemented CI/CD pipelines

Software Engineer at StartupXYZ (2018-2020)
- Built scalable microservices architecture
- Developed RESTful APIs using Node.js

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2014-2018)

SKILLS
JavaScript, TypeScript, React, Node.js, AWS, Docker, Kubernetes

CERTIFICATIONS
AWS Certified Solutions Architect
Google Cloud Professional Developer
  `.trim();

  describe('Handler Integration Tests', () => {
    it('should successfully parse CV text with valid Bedrock response', async () => {
      const mockBedrockResponse = {
        sections: {
          experiences: [
            'Senior Software Engineer at TechCorp (2020-2023)\n- Led development of cloud-native applications\n- Managed team of 5 developers\n- Implemented CI/CD pipelines',
            'Software Engineer at StartupXYZ (2018-2020)\n- Built scalable microservices architecture\n- Developed RESTful APIs using Node.js',
          ],
          education: [
            'Bachelor of Science in Computer Science\nUniversity of Technology (2014-2018)',
          ],
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
          certifications: [
            'AWS Certified Solutions Architect',
            'Google Cloud Professional Developer',
          ],
          raw_blocks: [],
        },
        confidence: 0.95,
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [{ text: JSON.stringify(mockBedrockResponse) }],
          })
        ),
      });

      const result = await handler({
        arguments: { cv_text: mockCvText },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections.experiences).toHaveLength(2);
      expect(parsed.sections.education).toHaveLength(1);
      expect(parsed.sections.skills).toHaveLength(7);
      expect(parsed.sections.certifications).toHaveLength(2);
      expect(parsed.confidence).toBe(0.95);
    });

    it('should validate output structure and apply operation-specific fallbacks', async () => {
      const mockBedrockResponse = {
        sections: {
          experiences: ['Some experience'],
          // Missing fields will be filled by operation-specific validation
        },
      };

      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [{ text: JSON.stringify(mockBedrockResponse) }],
          })
        ),
      });

      const result = await handler({
        arguments: { cv_text: mockCvText },
      });

      const parsed = JSON.parse(result);
      expect(parsed.sections.experiences).toEqual(['Some experience']);
      // Operation-specific validation fills missing fields
      expect(parsed.sections.education).toEqual([]);
      expect(parsed.sections.skills).toEqual([]);
      expect(parsed.sections.certifications).toEqual([]);
      expect(parsed.sections.raw_blocks).toEqual([]);
      expect(parsed.confidence).toBe(0.5); // DEFAULT_CONFIDENCE fallback
    });

    it('should throw error for invalid output structure', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  // Missing required sections field
                  confidence: 0.5,
                }),
              },
            ],
          })
        ),
      });

      await expect(
        handler({
          arguments: { cv_text: mockCvText },
        })
      ).rejects.toThrow('Missing required field: sections');
    });
  });
});
