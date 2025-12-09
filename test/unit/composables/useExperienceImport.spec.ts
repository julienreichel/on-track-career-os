import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { useExperienceImport } from '@/composables/useExperienceImport';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

// Mock the repository
vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
  })),
}));

describe('useExperienceImport', () => {
  let mockRepo: {
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      create: vi.fn(),
    };
    vi.mocked(ExperienceRepository).mockImplementation(() => mockRepo as never);
  });

  const mockExperiences: ExtractedExperience[] = [
    {
      title: 'Senior Developer',
      company: 'TechCorp',
      startDate: '2020-01',
      endDate: '2023-12',
      responsibilities: ['Lead team', 'Architect solutions'],
      tasks: ['Code reviews', 'Design features'],
    },
    {
      title: 'Developer',
      company: 'StartUp Inc',
      startDate: '2018-06',
      endDate: null,
      responsibilities: ['Build features'],
      tasks: ['Write tests'],
    },
  ];

  it('should import all experiences successfully', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });

    const count = await importExperiences(mockExperiences, 'raw CV text', 'user-123');

    expect(count).toBe(2);
    expect(mockRepo.create).toHaveBeenCalledTimes(2);
  });

  it('should pass correct data to repository', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });

    await importExperiences(mockExperiences, 'raw CV text', 'user-123');

    expect(mockRepo.create).toHaveBeenCalledWith({
      title: 'Senior Developer',
      companyName: 'TechCorp',
      startDate: '2020-01',
      endDate: '2023-12',
      responsibilities: ['Lead team', 'Architect solutions'],
      tasks: ['Code reviews', 'Design features'],
      rawText: 'raw CV text',
      status: 'draft',
      userId: 'user-123',
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      title: 'Developer',
      companyName: 'StartUp Inc',
      startDate: '2018-06',
      endDate: undefined,
      responsibilities: ['Build features'],
      tasks: ['Write tests'],
      rawText: 'raw CV text',
      status: 'draft',
      userId: 'user-123',
    });
  });

  it('should handle experiences with null endDate', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });

    const experiencesWithNullEnd: ExtractedExperience[] = [
      {
        title: 'Current Position',
        company: 'Company',
        startDate: '2023-01',
        endDate: null,
        responsibilities: ['Responsibility'],
        tasks: ['Task'],
      },
    ];

    await importExperiences(experiencesWithNullEnd, 'raw text', 'user-123');

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        endDate: undefined,
      })
    );
  });

  it('should return zero for empty experiences array', async () => {
    const { importExperiences } = useExperienceImport();

    const count = await importExperiences([], 'raw text', 'user-123');

    expect(count).toBe(0);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should handle partial failures and return success count', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create
      .mockResolvedValueOnce({ id: '1' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: '3' });

    const experiences: ExtractedExperience[] = [
      {
        title: 'Job 1',
        company: 'Company 1',
        startDate: '2020-01',
        endDate: '2021-01',
        responsibilities: [],
        tasks: [],
      },
      {
        title: 'Job 2',
        company: 'Company 2',
        startDate: '2021-01',
        endDate: '2022-01',
        responsibilities: [],
        tasks: [],
      },
      {
        title: 'Job 3',
        company: 'Company 3',
        startDate: '2022-01',
        endDate: null,
        responsibilities: [],
        tasks: [],
      },
    ];

    const count = await importExperiences(experiences, 'raw text', 'user-123');

    expect(count).toBe(2);
    expect(mockRepo.create).toHaveBeenCalledTimes(3);
  });

  it('should set status to draft for all experiences', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });

    await importExperiences(mockExperiences, 'raw text', 'user-123');

    const calls = mockRepo.create.mock.calls;
    calls.forEach((call) => {
      expect(call[0].status).toBe('draft');
    });
  });

  it('should handle empty responsibilities and tasks', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });

    const minimalExperiences: ExtractedExperience[] = [
      {
        title: 'Job Title',
        company: 'Company',
        startDate: '2020-01',
        endDate: '2021-01',
        responsibilities: [],
        tasks: [],
      },
    ];

    const count = await importExperiences(minimalExperiences, 'raw text', 'user-123');

    expect(count).toBe(1);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        responsibilities: [],
        tasks: [],
      })
    );
  });

  it('should preserve raw CV text for all experiences', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });

    const rawText = 'This is the original CV text content';
    await importExperiences(mockExperiences, rawText, 'user-123');

    const calls = mockRepo.create.mock.calls;
    calls.forEach((call) => {
      expect(call[0].rawText).toBe(rawText);
    });
  });
});
