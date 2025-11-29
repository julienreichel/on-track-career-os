import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(() => ({
    send: mockSend,
  })),
  InvokeModelCommand: vi.fn((input) => ({ input })),
}));

describe('ai.extractExperienceBlocks', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import handler after mocks are set up
    const module = await import('@amplify/data/ai-operations/extractExperienceBlocks');
    handler = module.handler;
  });

  describe('Handler Integration Tests', () => {
    it('should successfully extract experience blocks with all fields', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      title: 'Senior Software Engineer',
                      company: 'TechCorp Inc.',
                      start_date: '2020-03',
                      end_date: '2023-12',
                      responsibilities: ['Lead development team', 'Architecture decisions'],
                      tasks: ['Implemented microservices', 'Mentored junior developers'],
                    },
                  ],
                }),
              },
            ],
          })
        ),
      });

      const result = await handler({
        arguments: {
          experience_text_blocks: [
            'Senior Software Engineer at TechCorp Inc. (March 2020 - December 2023)',
          ],
        },
      });

      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0]).toEqual({
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        start_date: '2020-03',
        end_date: '2023-12',
        responsibilities: ['Lead development team', 'Architecture decisions'],
        tasks: ['Implemented microservices', 'Mentored junior developers'],
      });
    });

    it('should handle multiple experience blocks', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      title: 'Senior Developer',
                      company: 'Company A',
                      start_date: '2020-01',
                      end_date: null,
                      responsibilities: ['Team lead'],
                      tasks: ['Code reviews'],
                    },
                    {
                      title: 'Junior Developer',
                      company: 'Company B',
                      start_date: '2018-06',
                      end_date: '2019-12',
                      responsibilities: ['Development'],
                      tasks: ['Bug fixes'],
                    },
                  ],
                }),
              },
            ],
          })
        ),
      });

      const result = await handler({
        arguments: {
          experience_text_blocks: [
            'Senior Developer at Company A (2020-present)',
            'Junior Developer at Company B (2018-2019)',
          ],
        },
      });

      expect(result.experiences).toHaveLength(2);
      expect(result.experiences[0].title).toBe('Senior Developer');
      expect(result.experiences[0].end_date).toBeNull();
      expect(result.experiences[1].title).toBe('Junior Developer');
    });

    it('should apply operation-specific validation fallbacks', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      // Missing title and company - will use fallbacks
                      start_date: '2020-01',
                      end_date: null,
                      // Missing responsibilities and tasks - will default to []
                    },
                  ],
                }),
              },
            ],
          })
        ),
      });

      const result = await handler({
        arguments: {
          experience_text_blocks: ['Incomplete experience'],
        },
      });

      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].title).toBe('Experience 1'); // Fallback
      expect(result.experiences[0].company).toBe('Unknown Company'); // Fallback
      expect(result.experiences[0].responsibilities).toEqual([]); // Fallback
      expect(result.experiences[0].tasks).toEqual([]); // Fallback
    });

    it('should throw error for invalid output structure', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  invalid_field: 'data',
                }),
              },
            ],
          })
        ),
      });

      await expect(
        handler({
          arguments: {
            experience_text_blocks: ['Experience text'],
          },
        })
      ).rejects.toThrow('Missing required field: experiences');
    });
  });
});
