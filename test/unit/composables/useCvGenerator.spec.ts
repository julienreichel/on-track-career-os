import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCvGenerator } from '@/composables/useCvGenerator';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';

// Mock dependencies
vi.mock('@/domain/ai-operations/AiOperationsService');
vi.mock('@/domain/user-profile/UserProfileRepository');
vi.mock('@/domain/experience/ExperienceRepository');
vi.mock('@/domain/starstory/STARStoryService');

describe('useCvGenerator', () => {
  let mockAiService: {
    generateCv: ReturnType<typeof vi.fn>;
  };

  let mockUserProfileRepo: {
    get: ReturnType<typeof vi.fn>;
  };

  let mockExperienceRepo: {
    list: ReturnType<typeof vi.fn>;
  };

  let mockStoryService: {
    getStoriesByExperience: ReturnType<typeof vi.fn>;
  };

  const mockUserProfile: UserProfile = {
    id: 'user-123',
    userId: 'user-123',
    fullName: 'John Doe',
    headline: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    primaryEmail: 'john@example.com',
    primaryPhone: '+1 555 0100',
    workPermitInfo: 'Eligible to work in EU & US',
    socialLinks: ['https://linkedin.com/in/johndoe', 'https://github.com/johndoe'],
    goals: ['Lead technical teams', 'Build scalable systems'],
    strengths: ['Problem solving', 'Team leadership'],
    skills: ['TypeScript', 'Vue.js', 'Node.js'],
    languages: ['English', 'Spanish'],
    certifications: ['AWS Certified'],
    interests: ['Open source', 'Mentoring'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockExperiences: Experience[] = [
    {
      id: 'exp-1',
      userId: 'user-123',
      title: 'Senior Software Engineer',
      companyName: 'Tech Corp',
      startDate: '2022-01-01',
      endDate: '2024-01-01',
      experienceType: 'work',
      responsibilities: ['Lead development team', 'Architect solutions'],
      tasks: ['Code reviews', 'Sprint planning'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'exp-2',
      userId: 'user-123',
      title: 'Software Engineer',
      companyName: 'Startup Inc',
      startDate: '2020-01-01',
      endDate: '2021-12-31',
      experienceType: 'work',
      responsibilities: ['Build features', 'Fix bugs'],
      tasks: ['Write tests', 'Deploy code'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  const mockStories: STARStory[] = [
    {
      id: 'story-1',
      userId: 'user-123',
      experienceId: 'exp-1',
      situation: 'System was slow',
      task: 'Improve performance',
      action: 'Optimized database queries',
      result: 'Reduced load time by 50%',
      achievements: ['Performance boost', 'Better UX'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 'story-2',
      userId: 'user-123',
      experienceId: 'exp-1',
      situation: 'Team needed guidance',
      task: 'Mentor junior developers',
      action: 'Set up pair programming',
      result: 'Team velocity increased',
      achievements: ['Knowledge sharing', 'Team growth'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockAiService = {
      generateCv: vi.fn().mockResolvedValue('# John Doe\n\nSenior Software Engineer'),
    };

    mockUserProfileRepo = {
      get: vi.fn().mockResolvedValue(mockUserProfile),
    };

    mockExperienceRepo = {
      list: vi.fn().mockResolvedValue(mockExperiences),
    };

    mockStoryService = {
      getStoriesByExperience: vi.fn().mockImplementation((exp: Experience) => {
        return Promise.resolve(mockStories.filter((s) => s.experienceId === exp.id));
      }),
    };

    vi.mocked(AiOperationsService).mockImplementation(() => mockAiService as never);
    vi.mocked(UserProfileRepository).mockImplementation(() => mockUserProfileRepo as never);
    vi.mocked(ExperienceRepository).mockImplementation(() => mockExperienceRepo as never);
    vi.mocked(STARStoryService).mockImplementation(() => mockStoryService as never);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { generating, error } = useCvGenerator();

      expect(generating.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('generateCv', () => {
    it('should successfully generate CV with minimal options', async () => {
      const { generateCv, generating, error } = useCvGenerator();

      const result = await generateCv('user-123', ['exp-1']);

      expect(generating.value).toBe(false);
      expect(error.value).toBeNull();
      expect(result).toBe('# John Doe\n\nSenior Software Engineer');
      expect(mockUserProfileRepo.get).toHaveBeenCalledWith('user-123');
      expect(mockExperienceRepo.list).toHaveBeenCalledWith(mockUserProfile);
      expect(mockStoryService.getStoriesByExperience).toHaveBeenCalledWith(mockExperiences[0]);
      expect(mockAiService.generateCv).toHaveBeenCalled();
    });

    it('should set generating to true while generating', async () => {
      const { generateCv, generating } = useCvGenerator();

      let generatingDuringExecution = false;
      mockAiService.generateCv.mockImplementation(() => {
        generatingDuringExecution = generating.value;
        return Promise.resolve('# CV Content');
      });

      await generateCv('user-123', ['exp-1']);

      expect(generatingDuringExecution).toBe(true);
      expect(generating.value).toBe(false);
    });

    it('should generate CV with all optional sections enabled', async () => {
      const { generateCv } = useCvGenerator();

      const result = await generateCv('user-123', ['exp-1'], {
        includeSkills: true,
        includeLanguages: true,
        includeCertifications: true,
        includeInterests: true,
      });

      expect(result).toBe('# John Doe\n\nSenior Software Engineer');

      const aiInput = mockAiService.generateCv.mock.calls[0][0];
      expect(aiInput.skills).toEqual(['TypeScript', 'Vue.js', 'Node.js']);
      expect(aiInput.languages).toEqual(['English', 'Spanish']);
      expect(aiInput.certifications).toEqual(['AWS Certified']);
      expect(aiInput.interests).toEqual(['Open source', 'Mentoring']);
    });

    it('should include job description when provided', async () => {
      const { generateCv } = useCvGenerator();

      const jobDescription = 'Looking for a senior engineer with Vue.js experience';
      await generateCv('user-123', ['exp-1'], {
        jobDescription,
      });

      const aiInput = mockAiService.generateCv.mock.calls[0][0];
      expect(aiInput.jobDescription).toBe(jobDescription);
    });

    it('should generate CV with multiple experiences', async () => {
      const { generateCv } = useCvGenerator();

      await generateCv('user-123', ['exp-1', 'exp-2']);

      expect(mockStoryService.getStoriesByExperience).toHaveBeenCalledTimes(2);

      const aiInput = mockAiService.generateCv.mock.calls[0][0];
      expect(aiInput.selectedExperiences).toHaveLength(2);
      expect(aiInput.selectedExperiences[0].id).toBe('exp-1');
      expect(aiInput.selectedExperiences[1].id).toBe('exp-2');
    });

    it('should filter null values from profile arrays', async () => {
      const profileWithNulls = {
        ...mockUserProfile,
        goals: ['Goal 1', null, 'Goal 2'],
        strengths: [null, 'Strength 1'],
        skills: ['Skill 1', null],
        socialLinks: ['https://example.com', '', null as unknown as string],
      };
      mockUserProfileRepo.get.mockResolvedValue(profileWithNulls);

      const { generateCv } = useCvGenerator();
      await generateCv('user-123', ['exp-1'], { includeSkills: true });

      const aiInput = mockAiService.generateCv.mock.calls[0][0];
      expect(aiInput.userProfile.goals).toEqual(['Goal 1', 'Goal 2']);
      expect(aiInput.userProfile.strengths).toEqual(['Strength 1']);
      expect(aiInput.skills).toEqual(['Skill 1']);
      expect(aiInput.userProfile.socialLinks).toEqual(['https://example.com']);
    });

    it('should handle profile not found', async () => {
      mockUserProfileRepo.get.mockResolvedValue(null);

      const { generateCv, error } = useCvGenerator();
      const result = await generateCv('user-123', ['exp-1']);

      expect(result).toBeNull();
      expect(error.value).toBe('cvGenerator.errors.profileNotFound');
      expect(mockAiService.generateCv).not.toHaveBeenCalled();
    });

    it('should handle AI service errors', async () => {
      mockAiService.generateCv.mockRejectedValue(new Error('AI service failed'));

      const { generateCv, error, generating } = useCvGenerator();
      const result = await generateCv('user-123', ['exp-1']);

      expect(result).toBeNull();
      expect(error.value).toBe('AI service failed');
      expect(generating.value).toBe(false);
    });

    it('should handle repository errors during input building', async () => {
      mockExperienceRepo.list.mockRejectedValue(new Error('Database error'));

      const { generateCv, error } = useCvGenerator();
      const result = await generateCv('user-123', ['exp-1']);

      expect(result).toBeNull();
      expect(error.value).toBe('Database error');
    });

    it('should handle story loading errors gracefully', async () => {
      mockStoryService.getStoriesByExperience.mockRejectedValue(new Error('Story load failed'));

      const { generateCv, error } = useCvGenerator();
      const result = await generateCv('user-123', ['exp-1']);

      expect(result).toBeNull();
      expect(error.value).toBe('Story load failed');
    });

    it('should reset error state on new generation', async () => {
      const { generateCv, error } = useCvGenerator();

      // First call fails
      mockAiService.generateCv.mockRejectedValueOnce(new Error('First error'));
      await generateCv('user-123', ['exp-1']);
      expect(error.value).toBe('First error');

      // Second call succeeds
      mockAiService.generateCv.mockResolvedValueOnce('# New CV');
      await generateCv('user-123', ['exp-1']);
      expect(error.value).toBeNull();
    });
  });

  describe('buildGenerationInput', () => {
    it('should build complete input with all data', async () => {
      const { buildGenerationInput } = useCvGenerator();

      const input = await buildGenerationInput('user-123', ['exp-1'], {
        includeSkills: true,
        includeLanguages: true,
        includeCertifications: true,
        includeInterests: true,
        jobDescription: 'Test job description',
      });

      expect(input).not.toBeNull();
      expect(input?.userProfile.fullName).toBe('John Doe');
      expect(input?.userProfile.headline).toBe('Senior Software Engineer');
      expect(input?.userProfile.location).toBe('San Francisco, CA');
      expect(input?.userProfile.primaryEmail).toBe('john@example.com');
      expect(input?.userProfile.primaryPhone).toBe('+1 555 0100');
      expect(input?.userProfile.workPermitInfo).toBe('Eligible to work in EU & US');
      expect(input?.userProfile.socialLinks).toEqual([
        'https://linkedin.com/in/johndoe',
        'https://github.com/johndoe',
      ]);
      expect(input?.userProfile.goals).toEqual(['Lead technical teams', 'Build scalable systems']);
      expect(input?.selectedExperiences).toHaveLength(1);
      expect(input?.stories).toHaveLength(2);
      expect(input?.skills).toEqual(['TypeScript', 'Vue.js', 'Node.js']);
      expect(input?.languages).toEqual(['English', 'Spanish']);
      expect(input?.certifications).toEqual(['AWS Certified']);
      expect(input?.interests).toEqual(['Open source', 'Mentoring']);
      expect(input?.jobDescription).toBe('Test job description');
    });

    it('should map experience fields correctly', async () => {
      const { buildGenerationInput } = useCvGenerator();

      const input = await buildGenerationInput('user-123', ['exp-1']);

      const experience = input?.selectedExperiences[0];
      expect(experience?.id).toBe('exp-1');
      expect(experience?.title).toBe('Senior Software Engineer');
      expect(experience?.company).toBe('Tech Corp');
      expect(experience?.startDate).toBe('2022-01-01');
      expect(experience?.endDate).toBe('2024-01-01');
      expect(experience?.experienceType).toBe('work');
      expect(experience?.responsibilities).toEqual([
        'Lead development team',
        'Architect solutions',
      ]);
      expect(experience?.tasks).toEqual(['Code reviews', 'Sprint planning']);
    });

    it('should map story fields correctly', async () => {
      const { buildGenerationInput } = useCvGenerator();

      const input = await buildGenerationInput('user-123', ['exp-1']);

      const story = input?.stories[0];
      expect(story?.id).toBe('story-1');
      expect(story?.experienceId).toBe('exp-1');
      expect(story?.situation).toBe('System was slow');
      expect(story?.task).toBe('Improve performance');
      expect(story?.action).toBe('Optimized database queries');
      expect(story?.result).toBe('Reduced load time by 50%');
      expect(story?.achievements).toEqual(['Performance boost', 'Better UX']);
    });

    it('should handle empty experiences list', async () => {
      mockExperienceRepo.list.mockResolvedValue([]);

      const { buildGenerationInput } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input?.selectedExperiences).toEqual([]);
      expect(input?.stories).toEqual([]);
    });

    it('should handle experiences without stories', async () => {
      mockStoryService.getStoriesByExperience.mockResolvedValue([]);

      const { buildGenerationInput } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input?.selectedExperiences).toHaveLength(1);
      expect(input?.stories).toEqual([]);
    });

    it('should handle profile with missing optional fields', async () => {
      const minimalProfile = {
        id: 'user-123',
        userId: 'user-123',
        fullName: 'Jane Doe',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockUserProfileRepo.get.mockResolvedValue(minimalProfile);

      const { buildGenerationInput } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input?.userProfile.fullName).toBe('Jane Doe');
      expect(input?.userProfile.headline).toBeUndefined();
      expect(input?.userProfile.location).toBeUndefined();
      expect(input?.userProfile.goals).toBeUndefined();
    });

    it('should not include optional sections when options are false', async () => {
      const { buildGenerationInput } = useCvGenerator();

      const input = await buildGenerationInput('user-123', ['exp-1'], {
        includeSkills: false,
        includeLanguages: false,
        includeCertifications: false,
        includeInterests: false,
      });

      expect(input?.skills).toBeUndefined();
      expect(input?.languages).toBeUndefined();
      expect(input?.certifications).toBeUndefined();
      expect(input?.interests).toBeUndefined();
    });

    it('should return null when profile not found', async () => {
      mockUserProfileRepo.get.mockResolvedValue(null);

      const { buildGenerationInput, error } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input).toBeNull();
      expect(error.value).toBe('cvGenerator.errors.profileNotFound');
    });

    it('should handle errors during input building', async () => {
      mockExperienceRepo.list.mockRejectedValue(new Error('List failed'));

      const { buildGenerationInput, error } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input).toBeNull();
      expect(error.value).toBe('List failed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty experience IDs array', async () => {
      const { generateCv } = useCvGenerator();

      const result = await generateCv('user-123', []);

      const aiInput = mockAiService.generateCv.mock.calls[0][0];
      expect(aiInput.selectedExperiences).toEqual([]);
      expect(aiInput.stories).toEqual([]);
      expect(result).toBe('# John Doe\n\nSenior Software Engineer');
    });

    it('should handle non-existent experience IDs', async () => {
      const { generateCv } = useCvGenerator();

      const result = await generateCv('user-123', ['non-existent-id']);

      const aiInput = mockAiService.generateCv.mock.calls[0][0];
      expect(aiInput.selectedExperiences).toEqual([]);
      expect(result).toBe('# John Doe\n\nSenior Software Engineer');
    });

    it('should handle unknown error types', async () => {
      mockAiService.generateCv.mockRejectedValue('String error');

      const { generateCv, error } = useCvGenerator();
      await generateCv('user-123', ['exp-1']);

      expect(error.value).toBe('cvGenerator.errors.generationFailed');
    });

    it('should filter null values from experience arrays', async () => {
      const expWithNulls = {
        ...mockExperiences[0],
        responsibilities: ['Task 1', null, 'Task 2'],
        tasks: [null, 'Task 3'],
      };
      mockExperienceRepo.list.mockResolvedValue([expWithNulls]);

      const { buildGenerationInput } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input?.selectedExperiences[0].responsibilities).toEqual(['Task 1', 'Task 2']);
      expect(input?.selectedExperiences[0].tasks).toEqual(['Task 3']);
    });

    it('should filter null values from story arrays', async () => {
      const storyWithNulls = {
        ...mockStories[0],
        achievements: ['Achievement 1', null, 'Achievement 2'],
      };
      mockStoryService.getStoriesByExperience.mockResolvedValue([storyWithNulls]);

      const { buildGenerationInput } = useCvGenerator();
      const input = await buildGenerationInput('user-123', ['exp-1']);

      expect(input?.stories[0].achievements).toEqual(['Achievement 1', 'Achievement 2']);
    });
  });
});
