import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { useExperienceImport } from '@/composables/useExperienceImport';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

// Mock the repository
vi.mock('@/domain/experience/ExperienceRepository', () => ({
  ExperienceRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  })),
}));

describe('useExperienceImport', () => {
  let mockRepo: {
    create: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      create: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    };
    vi.mocked(ExperienceRepository).mockImplementation(() => mockRepo as never);
  });

  const mockExperiences: ExtractedExperience[] = [
    {
      title: 'Senior Developer',
      companyName: 'TechCorp',
      startDate: '2020-01',
      endDate: '2023-12',
      responsibilities: ['Lead team', 'Architect solutions'],
      tasks: ['Code reviews', 'Design features'],
      status: 'draft',
      experienceType: 'work',
    },
    {
      title: 'Developer',
      companyName: 'StartUp Inc',
      startDate: '2018-06',
      endDate: '',
      responsibilities: ['Build features'],
      tasks: ['Write tests'],
      status: 'draft',
      experienceType: 'work',
    },
  ];

  it('should import all experiences successfully', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });
    mockRepo.list.mockResolvedValue([]);

    const result = await importExperiences(mockExperiences, 'raw CV text', 'user-123');

    expect(result).toEqual({ createdCount: 2, updatedCount: 0 });
    expect(mockRepo.list).toHaveBeenCalledWith('user-123');
    expect(mockRepo.create).toHaveBeenCalledTimes(2);
  });

  it('should pass correct data to repository', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });
    mockRepo.list.mockResolvedValue([]);

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
      experienceType: 'work',
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
      experienceType: 'work',
      userId: 'user-123',
    });
  });

  it('should preserve experience type when creating records', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });
    mockRepo.list.mockResolvedValue([]);

    const experiences: ExtractedExperience[] = [
      {
        title: 'BSc Computer Science',
        companyName: 'MIT',
        startDate: '2014-09',
        endDate: '2018-06',
        responsibilities: [],
        tasks: [],
        experienceType: 'education',
        status: 'draft',
      },
    ];

    await importExperiences(experiences, 'raw CV text', 'user-123');

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        experienceType: 'education',
      })
    );
  });

  it('should handle experiences with null endDate', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });
    mockRepo.list.mockResolvedValue([]);

    const experiencesWithNullEnd: ExtractedExperience[] = [
      {
        title: 'Current Position',
        companyName: 'Company',
        startDate: '2023-01',
        endDate: '',
        responsibilities: ['Responsibility'],
        tasks: ['Task'],
        status: 'draft',
        experienceType: 'work',
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

    const result = await importExperiences([], 'raw text', 'user-123');

    expect(result).toEqual({ createdCount: 0, updatedCount: 0 });
    expect(mockRepo.list).toHaveBeenCalledWith('user-123');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should handle partial failures and return success count', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create
      .mockResolvedValueOnce({ id: '1' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: '3' });
    mockRepo.list.mockResolvedValue([]);

    const experiences: ExtractedExperience[] = [
      {
        title: 'Job 1',
        companyName: 'Company 1',
        startDate: '2020-01',
        endDate: '2021-01',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        experienceType: 'work',
      },
      {
        title: 'Job 2',
        companyName: 'Company 2',
        startDate: '2021-01',
        endDate: '2022-01',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        experienceType: 'work',
      },
      {
        title: 'Job 3',
        companyName: 'Company 3',
        startDate: '2022-01',
        endDate: '',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        experienceType: 'work',
      },
    ];

    const result = await importExperiences(experiences, 'raw text', 'user-123');

    expect(result).toEqual({ createdCount: 2, updatedCount: 0 });
    expect(mockRepo.create).toHaveBeenCalledTimes(3);
  });

  it('should preserve status for all experiences', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });
    mockRepo.list.mockResolvedValue([]);

    await importExperiences(mockExperiences, 'raw text', 'user-123');

    const calls = mockRepo.create.mock.calls;
    calls.forEach((call) => {
      expect(call[0].status).toBe('draft');
    });
  });

  it('should handle empty responsibilities and tasks', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.create.mockResolvedValue({ id: '1' });
    mockRepo.list.mockResolvedValue([]);

    const minimalExperiences: ExtractedExperience[] = [
      {
        title: 'Job Title',
        companyName: 'Company',
        startDate: '2020-01',
        endDate: '2021-01',
        responsibilities: [],
        tasks: [],
        status: 'draft',
        experienceType: 'work',
      },
    ];

    const result = await importExperiences(minimalExperiences, 'raw text', 'user-123');

    expect(result).toEqual({ createdCount: 1, updatedCount: 0 });
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
    mockRepo.list.mockResolvedValue([]);

    const rawText = 'This is the original CV text content';
    await importExperiences(mockExperiences, rawText, 'user-123');

    const calls = mockRepo.create.mock.calls;
    calls.forEach((call) => {
      expect(call[0].rawText).toBe(rawText);
    });
  });

  it('should merge matching experiences and avoid redundant responsibilities', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.list.mockResolvedValue([
      {
        id: 'exp-1',
        title: 'Senior Developer',
        companyName: 'TechCorp',
        startDate: '2020-01',
        endDate: '2023-12',
        responsibilities: ['Designed scalable payment processing system for international clients'],
        tasks: ['Automated deployment pipelines with terraform scripts'],
        rawText: 'existing text',
        status: 'draft',
        userId: 'user-123',
      },
    ]);
    mockRepo.update.mockResolvedValue({ id: 'exp-1' });

    const result = await importExperiences(
      [
        {
          title: 'Senior Developer',
          companyName: 'TechCorp',
          startDate: '2020-01',
          endDate: '2023-12',
          responsibilities: [
            'Led scalable payment processing system for international clients',
            'Mentored junior developers',
          ],
          tasks: [
            'Automated deployment pipelines with terraform scripts',
            'Reviewed pull requests',
          ],
          status: 'draft',
          experienceType: 'work',
        },
      ],
      'raw text',
      'user-123'
    );

    expect(result).toEqual({ createdCount: 0, updatedCount: 1 });
    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalledWith({
      id: 'exp-1',
      responsibilities: [
        'Designed scalable payment processing system for international clients',
        'Mentored junior developers',
      ],
      tasks: ['Automated deployment pipelines with terraform scripts', 'Reviewed pull requests'],
    });
  });

  it('should add responsibilities when keyword overlap is three or fewer', async () => {
    const { importExperiences } = useExperienceImport();

    mockRepo.list.mockResolvedValue([
      {
        id: 'exp-2',
        title: 'Product Manager',
        companyName: 'Visionary Labs',
        startDate: '2021-02',
        endDate: null,
        responsibilities: ['Managed project roadmap with stakeholder alignment'],
        tasks: [],
        rawText: 'existing text',
        status: 'draft',
        userId: 'user-123',
      },
    ]);
    mockRepo.update.mockResolvedValue({ id: 'exp-2' });

    const result = await importExperiences(
      [
        {
          title: 'Product Manager',
          companyName: 'Visionary Labs',
          startDate: '2021-02',
          endDate: '',
          responsibilities: ['Owned project roadmap and team alignment'],
          tasks: [],
          status: 'draft',
          experienceType: 'work',
        },
      ],
      'raw text',
      'user-123'
    );

    expect(result).toEqual({ createdCount: 0, updatedCount: 1 });
    expect(mockRepo.update).toHaveBeenCalledWith({
      id: 'exp-2',
      responsibilities: [
        'Managed project roadmap with stakeholder alignment',
        'Owned project roadmap and team alignment',
      ],
      tasks: [],
    });
  });
});
