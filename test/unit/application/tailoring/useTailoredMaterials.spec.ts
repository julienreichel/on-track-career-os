import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import { allowConsoleOutput } from '../../../setup/console-guard';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';
import type { UserProfile } from '@/domain/user-profile/UserProfile';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Company } from '@/domain/company/Company';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { UserProfileService } from '@/domain/user-profile/UserProfileService';
import type { CompanyService } from '@/domain/company/CompanyService';
import type { CVDocumentRepository } from '@/domain/cvdocument/CVDocumentRepository';
import type { CoverLetterService } from '@/domain/cover-letter/CoverLetterService';
import type { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import type { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type { MatchingSummaryService } from '@/domain/matching-summary/MatchingSummaryService';

const buildAuthStub = () => ({
  userId: ref<string | null>('user-1'),
  loadUserId: vi.fn().mockResolvedValue(undefined),
});

describe('useTailoredMaterials', () => {
  const userId = 'user-1';
  let job: JobDescription;
  let matchingSummary: MatchingSummary;
  let profile: UserProfile;
  let experiences: Experience[];
  let stories: STARStory[];
  let company: Company;
  let cvDocument: CVDocument;
  let coverLetter: CoverLetter;
  let speechBlock: SpeechBlock;

  beforeEach(() => {
    job = {
      id: 'job-1',
      title: 'Staff Engineer',
      companyId: 'company-1',
    } as JobDescription;

    matchingSummary = {
      id: 'summary-1',
      overallScore: 80,
      scoreBreakdown: {
        skillFit: 35,
        experienceFit: 25,
        interestFit: 10,
        edge: 10,
      },
      recommendation: 'apply',
      reasoningHighlights: ['Strong alignment'],
      strengthsForThisRole: ['System design leadership'],
      skillMatch: ['[MATCH] Architecture — led platform redesign'],
      riskyPoints: ['Risk: Limited fintech. Mitigation: highlight adaptability.'],
      impactOpportunities: ['Improve delivery cadence'],
      tailoringTips: ['Emphasize architecture wins'],
    } as MatchingSummary;

    profile = {
      id: userId,
      fullName: 'Casey Candidate',
      headline: 'Engineering Lead',
      skills: ['TypeScript'],
    } as UserProfile;

    experiences = [
      {
        id: 'exp-1',
        userId,
        title: 'Engineering Manager',
        companyName: 'Atlas',
        startDate: '2020-01-01',
      } as Experience,
    ];

    stories = [
      {
        id: 'story-1',
        experienceId: 'exp-1',
        situation: 'Low morale',
        task: 'Rebuild trust',
        action: 'Introduced rituals',
        result: 'Higher retention',
      } as STARStory,
    ];

    company = {
      id: 'company-1',
      companyName: 'Acme Systems',
      industry: 'Logistics',
      sizeRange: '201-500',
      website: 'https://acme.example',
      description: 'AI workflow platform',
    } as Company;

    cvDocument = {
      id: 'cv-1',
      name: 'Tailored CV — Staff Engineer',
      content: '# CV',
      userId,
      jobId: job.id,
    } as CVDocument;

    coverLetter = {
      id: 'cl-1',
      name: 'Cover Letter — Staff Engineer',
      content: 'Cover content',
      userId,
      jobId: job.id,
    } as CoverLetter;

    speechBlock = {
      id: 'sb-1',
      name: 'Speech — Staff Engineer',
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why',
      userId,
      jobId: job.id,
    } as SpeechBlock;
  });

  const createDependencies = () => ({
    aiService: {
      generateCv: vi.fn().mockResolvedValue('# CV'),
      generateCoverLetter: vi.fn().mockResolvedValue('Cover content'),
      generateSpeech: vi.fn().mockResolvedValue({
        elevatorPitch: 'Pitch',
        careerStory: 'Story',
        whyMe: 'Why',
      }),
    } as unknown as AiOperationsService,
    userProfileService: {
      getProfileForTailoring: vi.fn().mockResolvedValue({
        ...profile,
        experiences: experiences.map((experience) => ({
          ...experience,
          stories,
        })),
        canvas: null,
      }),
    } as unknown as UserProfileService,
    companyService: {
      getCompany: vi.fn().mockResolvedValue(company),
    } as unknown as CompanyService,
    cvRepository: {
      create: vi.fn().mockResolvedValue(cvDocument),
      update: vi.fn().mockResolvedValue(cvDocument),
    } as unknown as CVDocumentRepository,
    coverLetterService: {
      createCoverLetter: vi.fn().mockResolvedValue(coverLetter),
      updateCoverLetter: vi.fn().mockResolvedValue(coverLetter),
    } as unknown as CoverLetterService,
    speechBlockService: {
      createSpeechBlock: vi.fn().mockResolvedValue(speechBlock),
      updateSpeechBlock: vi.fn().mockResolvedValue(speechBlock),
    } as unknown as SpeechBlockService,
    jobService: {
      getFullJobDescription: vi.fn().mockResolvedValue(job),
    } as unknown as JobDescriptionService,
    matchingSummaryService: {
      getByContext: vi.fn().mockResolvedValue(matchingSummary),
    } as unknown as MatchingSummaryService,
  });

  it('generates tailored CV and persists jobId', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    const result = await engine.generateTailoredCvForJob({ job, matchingSummary });

    expect(result).toEqual(cvDocument);
    expect(deps.aiService.generateCv).toHaveBeenCalledWith(
      expect.objectContaining({
        jobDescription: expect.objectContaining({ title: job.title }),
        matchingSummary: expect.objectContaining({ overallScore: matchingSummary.overallScore }),
        company: expect.objectContaining({ companyName: company.companyName }),
      })
    );
    expect(deps.cvRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: job.id, isTailored: true, userId })
    );
  });

  it('regenerates cover letter using update (overwrite rule)', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    const result = await engine.regenerateTailoredCoverLetterForJob({
      id: coverLetter.id,
      job,
      matchingSummary,
    });

    expect(result).toEqual(coverLetter);
    expect(deps.coverLetterService.updateCoverLetter).toHaveBeenCalledWith(
      expect.objectContaining({ id: coverLetter.id, jobId: job.id })
    );
    expect(deps.coverLetterService.createCoverLetter).not.toHaveBeenCalled();
  });

  it('regenerates speech using update and keeps jobId', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    const result = await engine.regenerateTailoredSpeechForJob({
      id: speechBlock.id,
      job,
      matchingSummary,
    });

    expect(result).toEqual(speechBlock);
    expect(deps.speechBlockService.updateSpeechBlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: speechBlock.id, jobId: job.id })
    );
    expect(deps.speechBlockService.createSpeechBlock).not.toHaveBeenCalled();
  });

  it('generates cover letter without job companyId (no company context)', async () => {
    const jobWithoutCompany = { ...job, companyId: null };
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    const result = await engine.generateTailoredCoverLetterForJob({
      job: jobWithoutCompany,
      matchingSummary,
    });

    expect(result).toEqual(coverLetter);
    expect(deps.companyService.getCompany).not.toHaveBeenCalled();
    expect(deps.aiService.generateCoverLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        jobDescription: expect.objectContaining({ title: job.title }),
      })
    );
  });

  it('generates speech without job companyId (no company context)', async () => {
    const jobWithoutCompany = { ...job, companyId: null };
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    const result = await engine.generateTailoredSpeechForJob({
      job: jobWithoutCompany,
      matchingSummary,
    });

    expect(result).toEqual(speechBlock);
    expect(deps.companyService.getCompany).not.toHaveBeenCalled();
    expect(deps.aiService.generateSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        jobDescription: expect.objectContaining({ title: job.title }),
      })
    );
  });

  it('handles company loading error gracefully', async () => {
    const deps = createDependencies();
    deps.companyService.getCompany = vi.fn().mockRejectedValue(new Error('Company not found'));
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    await allowConsoleOutput(async () => {
      const result = await engine.generateTailoredCvForJob({ job, matchingSummary });
      expect(result).toEqual(cvDocument);
    });

    expect(deps.aiService.generateCv).toHaveBeenCalledWith(
      expect.objectContaining({
        jobDescription: expect.objectContaining({ title: job.title }),
        company: undefined,
      })
    );
  });

  it('generates cover letter and stores tone option', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    await engine.generateTailoredCoverLetterForJob({
      job,
      matchingSummary,
      options: { tone: 'formal', name: 'Custom Cover Letter' },
    });

    expect(deps.coverLetterService.createCoverLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'formal',
        name: 'Custom Cover Letter',
      })
    );
  });

  it('regenerates cover letter and preserves tone option', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    await engine.regenerateTailoredCoverLetterForJob({
      id: coverLetter.id,
      job,
      matchingSummary,
      options: { tone: 'casual' },
    });

    expect(deps.coverLetterService.updateCoverLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        id: coverLetter.id,
        tone: 'casual',
      })
    );
  });

  it('generates speech and stores custom name', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    await engine.generateTailoredSpeechForJob({
      job,
      matchingSummary,
      options: { name: 'Custom Speech' },
    });

    expect(deps.speechBlockService.createSpeechBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Speech',
      })
    );
  });

  it('regenerates speech and updates custom name', async () => {
    const deps = createDependencies();
    const engine = useTailoredMaterials({ auth: buildAuthStub(), dependencies: deps });

    await engine.regenerateTailoredSpeechForJob({
      id: speechBlock.id,
      job,
      matchingSummary,
      options: { name: 'Updated Speech' },
    });

    expect(deps.speechBlockService.updateSpeechBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: speechBlock.id,
        name: 'Updated Speech',
      })
    );
  });
});
