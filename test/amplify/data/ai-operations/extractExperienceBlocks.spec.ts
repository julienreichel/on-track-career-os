import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolve } from 'node:path';

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

    // Dynamically import handler after mocks are set up
    const modulePath = resolve(
      __dirname,
      '../../../../amplify/data/ai-operations/extractExperienceBlocks.ts'
    );
    const module = await import(modulePath);
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

    it('should handle markdown-wrapped JSON', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text:
                  '```json\n' +
                  JSON.stringify({
                    experiences: [
                      {
                        title: 'Developer',
                        company: 'TestCo',
                        start_date: '2021-01',
                        end_date: '2022-01',
                        responsibilities: ['Coding'],
                        tasks: ['Testing'],
                      },
                    ],
                  }) +
                  '\n```',
              },
            ],
          })
        ),
      });

      const result = await handler({
        arguments: {
          experience_text_blocks: ['Developer at TestCo (2021-2022)'],
        },
      });

      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].title).toBe('Developer');
    });

    it('should apply fallback for missing title', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      company: 'CompanyX',
                      start_date: '2020-01',
                      end_date: null,
                      responsibilities: [],
                      tasks: [],
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
          experience_text_blocks: ['Work at CompanyX'],
        },
      });

      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].title).toBe('Experience 1');
      expect(result.experiences[0].company).toBe('CompanyX');
    });

    it('should apply fallback for missing company', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      title: 'Software Engineer',
                      start_date: '2020-01',
                      end_date: null,
                      responsibilities: [],
                      tasks: [],
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
          experience_text_blocks: ['Software Engineer role'],
        },
      });

      expect(result.experiences[0].company).toBe('Unknown Company');
    });

    it('should apply fallback for missing arrays', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      title: 'Engineer',
                      company: 'TestCo',
                      start_date: '2020-01',
                      end_date: null,
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
          experience_text_blocks: ['Engineer at TestCo'],
        },
      });

      expect(result.experiences[0].responsibilities).toEqual([]);
      expect(result.experiences[0].tasks).toEqual([]);
    });

    it('should filter non-string items from arrays', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      title: 'Engineer',
                      company: 'TestCo',
                      start_date: '2020-01',
                      end_date: null,
                      responsibilities: ['Valid', 123, null, 'Another valid'],
                      tasks: ['Task 1', false, 'Task 2'],
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
          experience_text_blocks: ['Engineer at TestCo'],
        },
      });

      expect(result.experiences[0].responsibilities).toEqual(['Valid', 'Another valid']);
      expect(result.experiences[0].tasks).toEqual(['Task 1', 'Task 2']);
    });

    it('should retry with schema on JSON parse error', async () => {
      mockSend
        .mockResolvedValueOnce({
          body: Buffer.from(
            JSON.stringify({
              content: [{ text: 'Invalid JSON here' }],
            })
          ),
        })
        .mockResolvedValueOnce({
          body: Buffer.from(
            JSON.stringify({
              content: [
                {
                  text: JSON.stringify({
                    experiences: [
                      {
                        title: 'Recovered',
                        company: 'RetryTest',
                        start_date: '2020-01',
                        end_date: null,
                        responsibilities: [],
                        tasks: [],
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
          experience_text_blocks: ['Some experience text'],
        },
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(result.experiences[0].title).toBe('Recovered');
    });

    it('should throw error after retry fails', async () => {
      mockSend
        .mockResolvedValueOnce({
          body: Buffer.from(
            JSON.stringify({
              content: [{ text: 'Invalid JSON' }],
            })
          ),
        })
        .mockResolvedValueOnce({
          body: Buffer.from(
            JSON.stringify({
              content: [{ text: 'Still invalid' }],
            })
          ),
        });

      await expect(
        handler({
          arguments: {
            experience_text_blocks: ['Experience text'],
          },
        })
      ).rejects.toThrow();

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should throw error for missing experiences field', async () => {
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

  describe('Bedrock API Call Verification', () => {
    it('should call BedrockRuntimeClient.send once for successful parse', async () => {
      mockSend.mockResolvedValueOnce({
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify({
                  experiences: [
                    {
                      title: 'Test',
                      company: 'Test',
                      start_date: '2020-01',
                      end_date: null,
                      responsibilities: [],
                      tasks: [],
                    },
                  ],
                }),
              },
            ],
          })
        ),
      });

      await handler({
        arguments: {
          experience_text_blocks: ['test'],
        },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should call BedrockRuntimeClient.send twice when retry is triggered', async () => {
      mockSend
        .mockResolvedValueOnce({
          body: Buffer.from(
            JSON.stringify({
              content: [{ text: 'invalid' }],
            })
          ),
        })
        .mockResolvedValueOnce({
          body: Buffer.from(
            JSON.stringify({
              content: [
                {
                  text: JSON.stringify({
                    experiences: [
                      {
                        title: 'Test',
                        company: 'Test',
                        start_date: '2020-01',
                        end_date: null,
                        responsibilities: [],
                        tasks: [],
                      },
                    ],
                  }),
                },
              ],
            })
          ),
        });

      await handler({
        arguments: {
          experience_text_blocks: ['test'],
        },
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
