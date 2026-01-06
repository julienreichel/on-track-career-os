import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useSpeechEngine } from '@/composables/useSpeechEngine';
import type { SpeechResult } from '@/domain/ai-operations/SpeechResult';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import type { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { STARStoryService } from '@/domain/starstory/STARStoryService';

const buildAuthStub = () => ({
  userId: ref<string | null>('user-1'),
  loadUserId: vi.fn().mockResolvedValue(undefined),
});

describe('useSpeechEngine', () => {
  const userId = 'user-1';
  let profile: UserProfile;
  let canvas: PersonalCanvas;
  let experiences: Experience[];
  let story: STARStory;
  let speechResult: SpeechResult;

  beforeEach(() => {
    profile = {
      id: userId,
      fullName: 'Casey Candidate',
      headline: 'Engineering Lead',
      strengths: ['Leadership'],
    } as UserProfile;

    canvas = {
      id: 'canvas-1',
      userId,
      customerSegments: ['Scale-ups'],
      valueProposition: ['Delivery'],
      channels: ['Direct'],
      customerRelationships: ['Trusted'],
      keyActivities: ['Mentorship'],
      keyResources: ['Playbooks'],
      keyPartners: ['Vendors'],
      costStructure: ['Training'],
      revenueStreams: ['Salary'],
      needsUpdate: false,
    } as PersonalCanvas;

    experiences = [
      {
        id: 'exp-1',
        userId,
        title: 'Engineering Manager',
        companyName: 'Atlas',
        responsibilities: ['Scale teams'],
        tasks: ['Coach'],
      } as Experience,
    ];

    story = {
      id: 'story-1',
      experienceId: 'exp-1',
      situation: 'Low morale',
      task: 'Rebuild trust',
      action: 'Introduced rituals',
      result: 'Higher retention',
      achievements: ['Retention improved'],
    } as STARStory;

    speechResult = {
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why',
    };
  });

  type DepsStub = ReturnType<typeof createDepsBase>;

  function createDeps(overrides: Partial<DepsStub> = {}): DepsStub {
    return { ...createDepsBase(), ...overrides };
  }

  function createDepsBase() {
    return {
      aiService: {
        generateSpeech: vi.fn().mockResolvedValue(speechResult),
      } as unknown as AiOperationsService,
      userProfileService: {
        getFullUserProfile: vi.fn().mockResolvedValue(profile),
      } as unknown as UserProfileService,
      personalCanvasRepo: {
        list: vi.fn().mockResolvedValue([canvas]),
        getByUserId: vi.fn().mockResolvedValue(canvas),
      } as unknown as PersonalCanvasRepository,
      experienceRepo: {
        list: vi.fn().mockResolvedValue(experiences),
      } as unknown as ExperienceRepository,
      storyService: {
        getStoriesByExperience: vi.fn().mockResolvedValue([story]),
      } as unknown as STARStoryService,
    };
  }

  it('builds input from profile and experiences and calls the AI service', async () => {
    const deps = createDeps();
    const engine = useSpeechEngine({
      userId,
      auth: buildAuthStub(),
      dependencies: deps,
    });

    const result = await engine.generate();

    expect(result).toEqual(speechResult);
    expect(deps.userProfileService.getFullUserProfile).toHaveBeenCalledWith(userId);
    expect(deps.aiService.generateSpeech).toHaveBeenCalledTimes(1);

    const input = (deps.aiService.generateSpeech as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(input.language).toBe('en');
    expect(input.profile.fullName).toBe('Casey Candidate');
    expect(input.experiences).toHaveLength(1);
    expect(input.stories).toHaveLength(1);
    expect(input.personalCanvas?.valueProposition?.[0]).toBe('Delivery');
  });

  it('throws when profile is missing', async () => {
    const deps = createDeps({
      userProfileService: {
        getFullUserProfile: vi.fn().mockResolvedValue(null),
      } as unknown as UserProfileService,
    });

    const engine = useSpeechEngine({
      userId,
      auth: buildAuthStub(),
      dependencies: deps,
    });

    await expect(engine.generate()).rejects.toThrow('User profile not found');
  });
});
