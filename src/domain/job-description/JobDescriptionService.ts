import { JobDescriptionRepository } from './JobDescriptionRepository';
import type {
  JobDescription,
  JobDescriptionCreateInput,
  JobDescriptionUpdateInput,
} from './JobDescription';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';
import type { CompanyCreateInput, CompanyUpdateInput } from '@/domain/company/Company';
import { CompanyRepository } from '@/domain/company/CompanyRepository';
import { CompanyCanvasRepository } from '@/domain/company-canvas/CompanyCanvasRepository';
import type { CompanyAnalysisResult } from '@/domain/ai-operations/CompanyAnalysis';
import { normalizeCompanyName, mergeCompanyProfile } from '@/domain/company/companyMatching';
import { normalizeStringArray } from '@/domain/company/companyUtils';

const DEFAULT_JOB_TITLE = 'Job description pending analysis';

export class JobDescriptionService {
  constructor(
    private repo = new JobDescriptionRepository(),
    private aiService = new AiOperationsService(),
    private companyRepo = new CompanyRepository(),
    private companyCanvasRepo = new CompanyCanvasRepository()
  ) {}

  async getFullJobDescription(id: string): Promise<JobDescription | null> {
    return this.repo.get(id);
  }

  async listJobs(): Promise<JobDescription[]> {
    return this.repo.list();
  }

  async createJobFromRawText(rawText: string): Promise<JobDescription> {
    const sanitized = rawText?.trim();
    if (!sanitized) {
      throw new Error('Job description text cannot be empty');
    }

    const input: JobDescriptionCreateInput = {
      rawText: sanitized,
      title: DEFAULT_JOB_TITLE,
      status: 'draft',
      responsibilities: [],
      requiredSkills: [],
      behaviours: [],
      successCriteria: [],
      explicitPains: [],
    };

    const created = await this.repo.create(input);
    if (!created) {
      throw new Error('Failed to create job description');
    }
    return created;
  }

  async updateJob(
    jobId: string,
    patch: Partial<JobDescriptionUpdateInput>
  ): Promise<JobDescription> {
    if (!patch || Object.keys(patch).length === 0) {
      throw new Error('No updates provided');
    }

    const payload: JobDescriptionUpdateInput = {
      id: jobId,
      ...patch,
    } as JobDescriptionUpdateInput;

    const updated = await this.repo.update(payload);
    if (!updated) {
      throw new Error('Failed to update job description');
    }
    return updated;
  }

  async attachParsedJobDescription(
    jobId: string,
    parsed: ParsedJobDescription
  ): Promise<JobDescription> {
    return this.updateJob(jobId, this.buildParsedUpdatePayload(parsed));
  }

  async reanalyseJob(jobId: string): Promise<JobDescription> {
    const job = await this.repo.get(jobId);
    if (!job) {
      throw new Error('Job description not found');
    }

    const jobText = job.rawText?.trim();
    if (!jobText) {
      throw new Error('Job description has no raw text to analyse');
    }

    const parsed = await this.aiService.parseJobDescription(jobText);
    const updated = await this.attachParsedJobDescription(jobId, parsed);
    const enrichedJob = { ...updated, rawText: job.rawText };
    return this.autoLinkCompany(enrichedJob);
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.repo.delete(jobId);
  }

  private buildParsedUpdatePayload(
    parsed: ParsedJobDescription
  ): Partial<JobDescriptionUpdateInput> {
    return {
      title: parsed.title || DEFAULT_JOB_TITLE,
      seniorityLevel: parsed.seniorityLevel || '',
      roleSummary: parsed.roleSummary || '',
      responsibilities: parsed.responsibilities,
      requiredSkills: parsed.requiredSkills,
      behaviours: parsed.behaviours,
      successCriteria: parsed.successCriteria,
      explicitPains: parsed.explicitPains,
      status: 'analyzed',
    };
  }

  private async autoLinkCompany(job: JobDescription): Promise<JobDescription> {
    if (job.companyId || !job.rawText?.trim()) {
      return job;
    }

    try {
      const analysis = await this.aiService.analyzeCompanyInfo({
        companyName: job.title || 'Unknown Company',
        rawText: job.rawText,
        jobContext: {
          title: job.title ?? '',
          summary: job.roleSummary ?? '',
        },
      });
      return this.processCompanyLink(job, analysis);
    } catch (error) {
      console.warn('[JobDescriptionService] Failed to link company from job upload', error);
      return job;
    }
  }

  private async processCompanyLink(
    job: JobDescription,
    analysis: CompanyAnalysisResult
  ): Promise<JobDescription> {
    const normalizedName = normalizeCompanyName(analysis.companyProfile.companyName);
    if (!normalizedName) {
      return job;
    }

    let company = await this.companyRepo.findByNormalizedName(analysis.companyProfile.companyName);
    if (company) {
      const merged = mergeCompanyProfile(company, analysis.companyProfile);
      if (Object.keys(merged).length > 0) {
        const updatePayload: CompanyUpdateInput = {
          ...(merged as Partial<CompanyUpdateInput>),
          id: company.id,
        };
        const updated = await this.companyRepo.update(updatePayload);
        company = updated ?? company;
      }
    } else {
      const createInput: CompanyCreateInput = {
        companyName: analysis.companyProfile.companyName || 'Unknown Company',
        industry: analysis.companyProfile.industry || undefined,
        sizeRange: analysis.companyProfile.sizeRange || undefined,
        website: analysis.companyProfile.website || undefined,
        productsServices: normalizeStringArray(analysis.companyProfile.productsServices),
        targetMarkets: normalizeStringArray(analysis.companyProfile.targetMarkets),
        customerSegments: normalizeStringArray(analysis.companyProfile.customerSegments),
        description: analysis.companyProfile.description || undefined,
        rawNotes: job.rawText,
      };
      company = await this.companyRepo.create(createInput);
      if (company) {
        await this.initializeCompanyCanvas(company.id);
      }
    }

    if (!company || company.id === job.companyId) {
      return job;
    }

    const updatedJob = await this.repo.update({
      id: job.id,
      companyId: company.id,
    });
    return updatedJob ?? { ...job, companyId: company.id };
  }

  private async initializeCompanyCanvas(companyId: string) {
    await this.companyCanvasRepo.create({
      companyId,
      customerSegments: [],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
      needsUpdate: true,
    });
  }
}
