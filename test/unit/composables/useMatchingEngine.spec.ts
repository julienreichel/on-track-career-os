import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ref } from 'vue';
import { useMatchingEngine } from '@/composables/useMatchingEngine';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type {
  MatchingSummaryResult,
  MatchingSummaryInput,
} from '@/domain/ai-operations/MatchingSummaryResult';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Company } from '@/domain/company/Company';
import type { CompanyCanvas } from '@/domain/company-canvas/CompanyCanvas';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';
import type { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { PersonalCanvasRepository } from '@/domain/personal-canvas/PersonalCanvasRepository';
import type { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { CompanyService } from '@/domain/company/CompanyService';
import type { CompanyCanvasService } from '@/domain/company-canvas/CompanyCanvasService';

const buildAuthStub = () => ({
  userId: ref<string | null>(null),
  loadUserId: vi.fn().mockResolvedValue(undefined),
});

describe('useMatchingEngine', () => {
  const userId = 'user-1';
  const jobId = 'job-1';

  let job: JobDescription;
  let userProfile: UserProfile;
  let personalCanvas: PersonalCanvas;
  let experiences: Experience[];
  let story: STARStory;
  let company: Company;
  let companyCanvas: CompanyCanvas;
  let aiResult: MatchingSummaryResult;
  let persistedSummary: MatchingSummary;

  beforeEach(() => {
    job = {
      id: jobId,
      title: 'Head of Engineering',
      companyId: 'company-1',
      seniorityLevel: 'Director',
      roleSummary: 'Lead org',
      responsibilities: ['Lead team'],
      requiredSkills: ['Leadership'],
      behaviours: ['Ownership'],
      successCriteria: ['Improve delivery'],
      explicitPains: ['Reliability issues'],
    } as JobDescription;

    userProfile = {
      id: userId,
      fullName: 'Casey Candidate',
      headline: 'Engineering Leader',
      location: 'Remote',
      seniorityLevel: 'Director',
      workPermitInfo: 'US Citizen',
      goals: ['Grow teams'],
      aspirations: ['CTO'],
      personalValues: ['Trust'],
      strengths: ['Leadership'],
      interests: ['Robotics'],
      skills: ['Typescript'],
      certifications: ['PMP'],
      languages: ['English'],
    } as UserProfile;

    personalCanvas = {
      id: 'canvas-1',
      userId,
      customerSegments: ['Scale-ups'],
      valueProposition: ['Reliable delivery'],
      channels: ['Direct'],
      customerRelationships: ['Trusted advisor'],
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
        companyName: 'Atlas Robotics',
        startDate: '2021-01-01',
        experienceType: 'work',
        responsibilities: ['Scale teams'],
        tasks: ['Coach EMs'],
      },
    ] as Experience[];

    story = {
      id: 'story-1',
      experienceId: 'exp-1',
      situation: 'Low morale',
      task: 'Turnaround org',
      action: 'Built rituals',
      result: 'Improved retention',
      achievements: ['Reduced attrition by 30%'],
      kpiSuggestions: ['Attrition down 30%'],
    } as STARStory;

    company = {
      id: 'company-1',
      companyName: 'Acme Corp',
      industry: 'AI',
      sizeRange: '51-200',
      website: 'https://example.com',
      description: 'AI robotics',
      productsServices: ['Robotics platform'],
      targetMarkets: ['Manufacturing'],
      customerSegments: ['Enterprise'],
      rawNotes: 'Research notes',
    } as Company;

    companyCanvas = {
      id: 'comp-canvas',
      companyId: 'company-1',
      customerSegments: ['Robotics teams'],
      valuePropositions: ['Automation'],
      channels: ['Direct'],
      customerRelationships: ['High-touch'],
      revenueStreams: ['Licensing'],
      keyResources: ['Models'],
      keyActivities: ['R&D'],
      keyPartners: ['Cloud'],
      costStructure: ['Compute'],
      needsUpdate: false,
    } as CompanyCanvas;

    aiResult = {
      summaryParagraph: 'Strong fit',
      impactAreas: ['Scale leadership'],
      contributionMap: ['Leadership -> Strategy'],
      riskMitigationPoints: ['Needs onboarding'],
      generatedAt: new Date().toISOString(),
      needsUpdate: false,
      userFitScore: 85,
    };

    persistedSummary = {
      id: 'summary-1',
      userId,
      jobId,
      companyId: 'company-1',
      summaryParagraph: aiResult.summaryParagraph,
      impactAreas: aiResult.impactAreas,
      contributionMap: aiResult.contributionMap,
      riskMitigationPoints: aiResult.riskMitigationPoints,
      generatedAt: aiResult.generatedAt,
      needsUpdate: false,
      userFitScore: aiResult.userFitScore,
    } as MatchingSummary;
  });

  type DepsStub = ReturnType<typeof createDepsBase>;

  function createDeps(overrides: Partial<DepsStub> = {}): DepsStub {
    const base = createDepsBase();
    return { ...base, ...overrides };
  }

  function createDepsBase() {
    return {
      aiService: {
        generateMatchingSummary: vi.fn().mockResolvedValue(aiResult),
      } as unknown as AiOperationsService,
      matchingSummaryService: {
        getByContext: vi.fn().mockResolvedValue(null),
        upsertSummary: vi.fn().mockResolvedValue(persistedSummary),
      } as unknown as MatchingSummaryService,
      jobService: {
        getFullJobDescription: vi.fn().mockResolvedValue(job),
      } as unknown as JobDescriptionService,
      userProfileService: {
        getFullUserProfile: vi.fn().mockResolvedValue(userProfile),
      } as unknown as UserProfileService,
      personalCanvasRepo: {
        list: vi.fn().mockResolvedValue([personalCanvas]),
      } as unknown as PersonalCanvasRepository,
      experienceRepo: {
        list: vi.fn().mockResolvedValue(experiences),
      } as unknown as ExperienceRepository,
      storyService: {
        getStoriesByExperience: vi.fn().mockResolvedValue([story]),
      } as unknown as STARStoryService,
      companyService: {
        getCompany: vi.fn().mockResolvedValue(company),
      } as unknown as CompanyService,
      companyCanvasService: {
        getByCompanyId: vi.fn().mockResolvedValue(companyCanvas),
      } as unknown as CompanyCanvasService,
    };
  }

  it('loads existing summary context and regenerates via AI', async () => {
    const deps = createDeps();
    const auth = buildAuthStub();
    const engine = useMatchingEngine(jobId, {
      userId,
      auth,
      dependencies: deps,
    });

    await engine.load();
    expect(deps.jobService.getFullJobDescription).toHaveBeenCalledWith(jobId);
    expect(deps.userProfileService.getFullUserProfile).toHaveBeenCalledWith(userId);
    expect(deps.matchingSummaryService.getByContext).toHaveBeenCalledWith({
      userId,
      jobId,
      companyId: 'company-1',
    });

    await engine.regenerate();

    expect(deps.aiService.generateMatchingSummary).toHaveBeenCalledTimes(1);
    expect(deps.matchingSummaryService.upsertSummary).toHaveBeenCalledWith({
      userId,
      jobId,
      companyId: 'company-1',
      summary: aiResult,
    });

    const aiGenerateMock = asMock(deps.aiService.generateMatchingSummary);
    const inputArg = aiGenerateMock.mock.calls[0][0] as MatchingSummaryInput;
    expect(inputArg.profile.fullName).toBe('Casey Candidate');
    expect(inputArg.jobDescription.title).toBe('Head of Engineering');
    expect(inputArg.company?.companyName).toBe('Acme Corp');
    expect(engine.matchingSummary.value).toEqual(persistedSummary);
  });

  it('handles missing company context gracefully', async () => {
    const deps = createDeps({
      jobService: {
        getFullJobDescription: vi.fn().mockResolvedValue({ ...job, companyId: null }),
      } as unknown as JobDescriptionService,
      companyService: {
        getCompany: vi.fn(),
      } as unknown as CompanyService,
      companyCanvasService: {
        getByCompanyId: vi.fn(),
      } as unknown as CompanyCanvasService,
    });
    const auth = buildAuthStub();
    const engine = useMatchingEngine(jobId, {
      userId,
      auth,
      dependencies: deps,
    });

    await engine.load();
    await engine.regenerate();

    expect(deps.companyService.getCompany).not.toHaveBeenCalled();
    const aiGenerateMock = asMock(deps.aiService.generateMatchingSummary);
    const inputArg = aiGenerateMock.mock.calls[0][0] as MatchingSummaryInput;
    expect(inputArg.company).toBeUndefined();
  });

  it('omits personal canvas when not found', async () => {
    const deps = createDeps({
      personalCanvasRepo: {
        list: vi.fn().mockResolvedValue([]),
      } as unknown as PersonalCanvasRepository,
    });
    const auth = buildAuthStub();
    const engine = useMatchingEngine(jobId, {
      userId,
      auth,
      dependencies: deps,
    });

    await engine.load();
    await engine.regenerate();

    const aiGenerateMock = asMock(deps.aiService.generateMatchingSummary);
    const inputArg = aiGenerateMock.mock.calls[0][0] as MatchingSummaryInput;
    expect(inputArg.personalCanvas).toBeUndefined();
  });

  it('captures AI errors without persisting', async () => {
    const deps = createDeps();
    asMock(deps.aiService.generateMatchingSummary).mockRejectedValue(new Error('AI failed'));
    const auth = buildAuthStub();
    const engine = useMatchingEngine(jobId, {
      userId,
      auth,
      dependencies: deps,
    });

    await engine.load();
    await expect(engine.regenerate()).rejects.toThrow('AI failed');
    expect(engine.error.value).toBe('AI failed');
    expect(deps.matchingSummaryService.upsertSummary).not.toHaveBeenCalled();
  });

  it('reflects existing summaries returned by the service', async () => {
    const deps = createDeps();
    asMock(deps.matchingSummaryService.getByContext).mockResolvedValue(persistedSummary);
    const auth = buildAuthStub();
    const engine = useMatchingEngine(jobId, {
      userId,
      auth,
      dependencies: deps,
    });

    await engine.load();
    expect(engine.matchingSummary.value).toEqual(persistedSummary);
    expect(engine.hasSummary.value).toBe(true);
  });
});
const asMock = <T extends (...args: any[]) => any>(fn: T) =>
  fn as unknown as Mock<Parameters<T>, ReturnType<T>>;
