import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useCoverLetterEngine } from '@/composables/useCoverLetterEngine';
import { allowConsoleOutput } from '../../setup/console-guard';
import type { CoverLetterResult } from '@/domain/ai-operations/CoverLetterResult';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { STARStoryService } from '@/domain/starstory/STARStoryService';

const buildAuthStub = () => ({
  userId: ref<string | null>('user-1'),
  loadUserId: vi.fn().mockResolvedValue(undefined),
});

// eslint-disable-next-line max-lines-per-function
describe('useCoverLetterEngine', () => {
  const userId = 'user-1';
  let profile: UserProfile;
  let canvas: PersonalCanvas;
  let experiences: Experience[];
  let story: STARStory;
  let coverLetterResult: CoverLetterResult;

  beforeEach(() => {
    profile = {
      id: userId,
      fullName: 'Alex Developer',
      headline: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      seniorityLevel: 'senior',
      goals: ['Lead technical initiatives'],
      strengths: ['Problem solving', 'Team collaboration'],
      skills: ['TypeScript', 'Vue.js'],
    } as UserProfile;

    canvas = {
      id: 'canvas-1',
      userId,
      customerSegments: ['Tech startups', 'Scale-ups'],
      valueProposition: ['Fast delivery', 'Quality code'],
      channels: ['Direct'],
      customerRelationships: ['Trusted advisor'],
      keyActivities: ['Mentorship', 'Architecture'],
      keyResources: ['Technical expertise'],
      keyPartners: ['Open source community'],
      costStructure: ['Training'],
      revenueStreams: ['Salary'],
      needsUpdate: false,
    } as PersonalCanvas;

    experiences = [
      {
        id: 'exp-1',
        userId,
        title: 'Senior Software Engineer',
        companyName: 'TechCorp',
        startDate: '2020-01',
        endDate: '2023-12',
        responsibilities: ['Lead development team'],
        tasks: ['Code review', 'Architecture decisions'],
      } as Experience,
    ];

    story = {
      id: 'story-1',
      experienceId: 'exp-1',
      title: 'Scaled platform to handle 10x traffic',
      situation: 'Platform struggling with growth',
      task: 'Redesign architecture for scale',
      action: 'Implemented microservices and caching',
      result: 'Reduced latency by 60%, handled 10x traffic',
      achievements: ['Improved performance', 'Increased reliability'],
    } as STARStory;

    coverLetterResult = {
      content: 'Dear Hiring Manager,\n\nI am excited to apply...',
    };
  });

  type DepsStub = ReturnType<typeof createDepsBase>;

  function createDeps(overrides: Partial<DepsStub> = {}): DepsStub {
    const base = createDepsBase();
    return {
      ...base,
      ...overrides,
      userProfileService: overrides.userProfileService
        ? ({ ...base.userProfileService, ...overrides.userProfileService } as UserProfileService)
        : base.userProfileService,
    };
  }

  function createDepsBase() {
    return {
      aiService: {
        generateCoverLetter: vi.fn().mockResolvedValue(coverLetterResult),
      } as unknown as AiOperationsService,
      userProfileService: {
        getFullUserProfile: vi.fn().mockResolvedValue(profile),
        getCanvasForUser: vi.fn().mockResolvedValue(canvas),
      } as unknown as UserProfileService,
      experienceRepo: {
        list: vi.fn().mockResolvedValue(experiences),
      } as unknown as ExperienceRepository,
      storyService: {
        getStoriesByExperience: vi.fn().mockResolvedValue([story]),
      } as unknown as STARStoryService,
    };
  }

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      expect(engine.userProfile.value).toBeNull();
      expect(engine.personalCanvas.value).toBeNull();
      expect(engine.experiences.value).toEqual([]);
      expect(engine.stories.value).toEqual([]);
      expect(engine.isLoading.value).toBe(false);
      expect(engine.isGenerating.value).toBe(false);
      expect(engine.error.value).toBeNull();
      expect(engine.hasProfile.value).toBe(false);
    });

    it('should accept a userId parameter', () => {
      const deps = createDeps();

      allowConsoleOutput(() => {
        const engine = useCoverLetterEngine({ userId: 'user-123', dependencies: deps });
        expect(engine).toBeDefined();
        expect(engine.load).toBeDefined();
      });
    });
  });

  describe('load', () => {
    it('should load user profile, canvas, experiences, and stories', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      const result = await engine.load();

      expect(engine.isLoading.value).toBe(false);
      expect(engine.error.value).toBeNull();
      expect(engine.userProfile.value).toEqual(profile);
      expect(engine.personalCanvas.value).toEqual(canvas);
      expect(engine.experiences.value).toEqual(experiences);
      expect(engine.stories.value).toEqual([story]);
      expect(engine.hasProfile.value).toBe(true);

      expect(result).toEqual({
        userProfile: profile,
        personalCanvas: canvas,
        experiences: experiences,
        stories: [story],
      });
    });

    it('should set loading state during load', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      let loadingDuringOperation = false;
      const loadPromise = engine.load();
      loadingDuringOperation = engine.isLoading.value;
      await loadPromise;

      expect(loadingDuringOperation).toBe(true);
      expect(engine.isLoading.value).toBe(false);
    });

    it('should handle errors and set error state', async () => {
      const errorMessage = 'Failed to load profile';
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockRejectedValue(new Error(errorMessage)),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await allowConsoleOutput(async () => {
        const result = await engine.load();
        expect(result).toBeUndefined();
      });

      expect(engine.isLoading.value).toBe(false);
      expect(engine.error.value).toBe(errorMessage);
    });

    it('should load canvas even if it does not exist (returns null)', async () => {
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profile),
          getCanvasForUser: vi.fn().mockResolvedValue(null),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();

      expect(engine.personalCanvas.value).toBeNull();
      expect(engine.error.value).toBeNull();
    });

    it('should handle canvas repository errors gracefully', async () => {
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profile),
          getCanvasForUser: vi.fn().mockRejectedValue(new Error('Canvas not found')),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();

      expect(engine.personalCanvas.value).toBeNull();
      expect(engine.error.value).toBeNull(); // Canvas errors are silently handled
    });

    it('should load stories for all experiences', async () => {
      const experiences2: Experience[] = [
        {
          id: 'exp-1',
          userId,
          title: 'Engineer',
          companyName: 'Company A',
        } as Experience,
        {
          id: 'exp-2',
          userId,
          title: 'Lead',
          companyName: 'Company B',
        } as Experience,
      ];

      const story1: STARStory = { id: 'story-1', experienceId: 'exp-1' } as STARStory;
      const story2: STARStory = { id: 'story-2', experienceId: 'exp-2' } as STARStory;

      const mockGetStories = vi
        .fn()
        .mockResolvedValueOnce([story1])
        .mockResolvedValueOnce([story2]);

      const deps = createDeps({
        experienceRepo: {
          list: vi.fn().mockResolvedValue(experiences2),
        } as unknown as ExperienceRepository,
        storyService: {
          getStoriesByExperience: mockGetStories,
        } as unknown as STARStoryService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();

      expect(engine.stories.value).toEqual([story1, story2]);
      expect(mockGetStories).toHaveBeenCalledWith('exp-1');
      expect(mockGetStories).toHaveBeenCalledWith('exp-2');
    });

    it('should use provided userId instead of auth', async () => {
      const customUserId = 'custom-user-123';
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({
        userId: customUserId,
        auth,
        dependencies: deps,
      });

      await engine.load();

      expect(deps.userProfileService.getFullUserProfile).toHaveBeenCalledWith(customUserId);
      expect(auth.loadUserId).not.toHaveBeenCalled();
    });

    it('should load userId from auth if not provided', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      auth.userId.value = 'auth-user-456';

      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();

      expect(deps.userProfileService.getFullUserProfile).toHaveBeenCalledWith('auth-user-456');
    });

    it('should call loadUserId if auth userId is not set', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      auth.userId.value = null;
      auth.loadUserId.mockImplementation(() => {
        auth.userId.value = 'loaded-user-789';
        return Promise.resolve();
      });

      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();

      expect(auth.loadUserId).toHaveBeenCalled();
      expect(deps.userProfileService.getFullUserProfile).toHaveBeenCalledWith('loaded-user-789');
    });

    it('should throw error if user is not authenticated', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      auth.userId.value = null;
      auth.loadUserId.mockResolvedValue(undefined); // userId stays null

      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await allowConsoleOutput(async () => {
        const result = await engine.load();
        expect(result).toBeUndefined();
      });

      expect(engine.error.value).toBe('User not authenticated');
    });

    it('should throw error if profile is not found', async () => {
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(null),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await allowConsoleOutput(async () => {
        const result = await engine.load();
        expect(result).toBeUndefined();
      });

      expect(engine.error.value).toBe('User profile not found');
    });

    it('should throw error if profile fullName is missing', async () => {
      const profileWithoutName = { ...profile, fullName: '' };
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profileWithoutName),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await allowConsoleOutput(async () => {
        const result = await engine.load();
        expect(result).toBeUndefined();
      });

      expect(engine.error.value).toBe('Profile fullName is required to generate cover letter');
    });
  });

  describe('generate', () => {
    it('should generate cover letter with loaded data', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();
      const result = await engine.generate();

      expect(engine.isGenerating.value).toBe(false);
      expect(engine.error.value).toBeNull();
      expect(result).toEqual(coverLetterResult);
      expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en',
          profile: expect.objectContaining({
            fullName: 'Alex Developer',
            headline: 'Senior Software Engineer',
          }),
          experiences: expect.arrayContaining([
            expect.objectContaining({
              title: 'Senior Software Engineer',
              companyName: 'TechCorp',
            }),
          ]),
          stories: expect.arrayContaining([
            expect.objectContaining({
              title: 'Scaled platform to handle 10x traffic',
            }),
          ]),
          personalCanvas: expect.objectContaining({
            customerSegments: ['Tech startups', 'Scale-ups'],
          }),
        })
      );
    });

    it('should generate cover letter with job description', async () => {
      const jobDescription = {
        title: 'Senior Engineer',
        seniorityLevel: 'Senior',
        roleSummary: 'We are looking for a Senior Engineer...',
        responsibilities: ['Lead team', 'Code review'],
        requiredSkills: ['TypeScript', 'Leadership'],
        behaviours: ['Collaborative'],
        successCriteria: ['Deliver on time'],
        explicitPains: ['Technical debt'],
        atsKeywords: ['Senior', 'Engineer', 'Leadership'],
      };

      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();
      const result = await engine.generate(jobDescription);

      expect(result).toEqual(coverLetterResult);
      expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          jobDescription,
        })
      );
    });

    it('should load data automatically if not loaded', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      // Don't call load(), call generate() directly
      const result = await engine.generate();

      expect(engine.userProfile.value).toEqual(profile);
      expect(result).toEqual(coverLetterResult);
      expect(deps.userProfileService.getFullUserProfile).toHaveBeenCalled();
    });

    it('should set generating state during generation', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      let generatingDuringOperation = false;
      const generatePromise = engine.generate();
      generatingDuringOperation = engine.isGenerating.value;
      await generatePromise;

      expect(generatingDuringOperation).toBe(true);
      expect(engine.isGenerating.value).toBe(false);
    });

    it('should handle generation errors', async () => {
      const errorMessage = 'AI service unavailable';
      const deps = createDeps({
        aiService: {
          generateCoverLetter: vi.fn().mockRejectedValue(new Error(errorMessage)),
        } as unknown as AiOperationsService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await allowConsoleOutput(async () => {
        const result = await engine.generate();
        expect(result).toBeUndefined();
      });

      expect(engine.isGenerating.value).toBe(false);
      expect(engine.error.value).toBe(errorMessage);
    });

    it('should fail if profile fullName is missing', async () => {
      const profileWithoutName = { ...profile, fullName: '' };
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profileWithoutName),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await allowConsoleOutput(async () => {
        const result = await engine.generate();
        expect(result).toBeUndefined();
      });

      // Error message depends on which check fails first (load or generate)
      expect(engine.error.value).toMatch(/fullName is required/);
    });

    it('should map profile data correctly for AI input', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.generate();

      expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: {
            fullName: 'Alex Developer',
            headline: 'Senior Software Engineer',
            location: 'San Francisco, CA',
            seniorityLevel: 'senior',
            goals: ['Lead technical initiatives'],
            strengths: ['Problem solving', 'Team collaboration'],
            skills: ['TypeScript', 'Vue.js'],
            workPermitInfo: undefined,
            aspirations: undefined,
            personalValues: undefined,
            interests: undefined,
            certifications: undefined,
            languages: undefined,
          },
        })
      );
    });

    it('should map experiences data correctly for AI input', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.generate();

      expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          experiences: expect.arrayContaining([
            expect.objectContaining({
              title: 'Senior Software Engineer',
              companyName: 'TechCorp',
              experienceType: 'work',
              startDate: '2020-01',
              endDate: '2023-12',
              responsibilities: ['Lead development team'],
              tasks: ['Code review', 'Architecture decisions'],
              achievements: [],
              kpiSuggestions: [],
            }),
          ]),
        })
      );
    });

    it('should generate without canvas if not available', async () => {
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profile),
          getCanvasForUser: vi.fn().mockResolvedValue(null),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.generate();

      expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          personalCanvas: undefined,
        })
      );
    });

    it('should filter null values from arrays', async () => {
      const profileWithNulls = {
        ...profile,
        goals: ['Goal 1', null, 'Goal 2'],
        strengths: [null, 'Strength 1'],
      } as UserProfile;

      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profileWithNulls),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.generate();

      expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            goals: ['Goal 1', 'Goal 2'],
            strengths: ['Strength 1'],
          }),
        })
      );
    });
  });

  describe('hasProfile', () => {
    it('should be false initially', () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      expect(engine.hasProfile.value).toBe(false);
    });

    it('should be true after loading profile with fullName', async () => {
      const deps = createDeps();
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      await engine.load();

      expect(engine.hasProfile.value).toBe(true);
    });

    it('should be false if profile fullName is missing', async () => {
      const profileWithoutName = { ...profile, fullName: '' };
      const deps = createDeps({
        userProfileService: {
          getFullUserProfile: vi.fn().mockResolvedValue(profileWithoutName),
        } as unknown as UserProfileService,
      });
      const auth = buildAuthStub();
      const engine = useCoverLetterEngine({ auth, dependencies: deps });

      // Load will fail, but let's set profile manually to test computed
      engine.userProfile.value = profileWithoutName;

      expect(engine.hasProfile.value).toBe(false);
    });
  });
});
