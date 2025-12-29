import { JobDescriptionRepository } from './JobDescriptionRepository';
import type {
  JobDescription,
  JobDescriptionCreateInput,
  JobDescriptionUpdateInput,
} from './JobDescription';
import { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { ParsedJobDescription } from '@/domain/ai-operations/ParsedJobDescription';

const DEFAULT_JOB_TITLE = 'Job description pending analysis';

export class JobDescriptionService {
  constructor(
    private repo = new JobDescriptionRepository(),
    private aiService = new AiOperationsService()
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
    return this.attachParsedJobDescription(jobId, parsed);
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
}
