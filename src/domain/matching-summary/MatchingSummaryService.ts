import type {
  MatchingSummary,
  MatchingSummaryCreateInput,
  MatchingSummaryUpdateInput,
} from './MatchingSummary';
import { MatchingSummaryRepository } from './MatchingSummaryRepository';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';
import { JobDescriptionRepository } from '@/domain/job-description/JobDescriptionRepository';

export interface MatchingSummaryContext {
  userId: string;
  jobId: string;
  companyId?: string | null;
}

export interface UpsertMatchingSummaryInput extends MatchingSummaryContext {
  summary: MatchingSummaryResult;
}

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => Boolean(entry));
}

type DatedSummary = MatchingSummary & {
  updatedAt?: string | null;
  createdAt?: string | null;
  generatedAt?: string | null;
};

function pickMostRecent(items: DatedSummary[]) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.updatedAt ?? a.generatedAt ?? a.createdAt ?? 0).getTime();
    const dateB = new Date(b.updatedAt ?? b.generatedAt ?? b.createdAt ?? 0).getTime();
    return dateB - dateA;
  })[0] ?? null;
}

function selectMatchingSummary(
  summaries: MatchingSummary[],
  context: MatchingSummaryContext
): MatchingSummary | null {
  const userSummaries = summaries.filter((summary) => summary.userId === context.userId);
  if (!userSummaries.length) {
    return null;
  }

  const companyId = context.companyId ?? null;
  const companyMatches = companyId
    ? userSummaries.filter((summary) => summary.companyId === companyId)
    : [];
  const jobMatches = userSummaries.filter((summary) => !summary.companyId);
  let candidates = userSummaries;
  if (companyMatches.length) {
    candidates = companyMatches;
  } else if (jobMatches.length) {
    candidates = jobMatches;
  }

  return pickMostRecent(candidates as DatedSummary[]);
}

export function mapMatchingSummaryResult(
  result: MatchingSummaryResult
): Omit<MatchingSummaryCreateInput, 'userId' | 'jobId'> {
  const normalized: Omit<MatchingSummaryCreateInput, 'userId' | 'jobId'> = {
    overallScore: typeof result.overallScore === 'number' ? result.overallScore : 0,
    scoreBreakdown: JSON.stringify(
      result.scoreBreakdown || {
        skillFit: 0,
        experienceFit: 0,
        interestFit: 0,
        edge: 0,
      }
    ),
    recommendation: result.recommendation || 'maybe',
    reasoningHighlights: sanitizeArray(result.reasoningHighlights),
    strengthsForThisRole: sanitizeArray(result.strengthsForThisRole),
    skillMatch: sanitizeArray(result.skillMatch),
    riskyPoints: sanitizeArray(result.riskyPoints),
    impactOpportunities: sanitizeArray(result.impactOpportunities),
    tailoringTips: sanitizeArray(result.tailoringTips),
    generatedAt: sanitizeString(result.generatedAt) || new Date().toISOString(),
    needsUpdate: Boolean(result.needsUpdate),
  };

  return normalized;
}

export class MatchingSummaryService {
  constructor(
    private repo: MatchingSummaryRepository = new MatchingSummaryRepository(),
    private jobRepo: JobDescriptionRepository = new JobDescriptionRepository()
  ) {}

  async getById(id: string) {
    return this.repo.get(id);
  }

  async getByContext(context: MatchingSummaryContext) {
    if (!context.userId || !context.jobId) {
      throw new Error('userId and jobId are required');
    }
    const summaries = await this.jobRepo.getMatchingSummaries(context.jobId);
    return selectMatchingSummary(summaries, context);
  }

  async listByJob(jobId: string) {
    if (!jobId) {
      throw new Error('jobId is required');
    }
    return this.jobRepo.getMatchingSummaries(jobId);
  }

  async upsertSummary(params: UpsertMatchingSummaryInput): Promise<MatchingSummary> {
    const { userId, jobId, companyId, summary } = params;
    if (!userId || !jobId) {
      throw new Error('userId and jobId are required to upsert matching summary');
    }

    const existing = await this.getByContext({ userId, jobId, companyId });
    const mapped = mapMatchingSummaryResult(summary);

    if (existing) {
      const updatePayload: MatchingSummaryUpdateInput = {
        id: existing.id,
        ...mapped,
      };
      if (typeof companyId === 'string') {
        updatePayload.companyId = companyId;
      }

      const updated = await this.repo.update(updatePayload);
      if (!updated) {
        throw new Error('Failed to update matching summary');
      }
      return updated;
    }

    const createPayload: MatchingSummaryCreateInput = {
      userId,
      jobId,
      ...mapped,
    };
    if (typeof companyId === 'string') {
      createPayload.companyId = companyId;
    }

    const created = await this.repo.create(createPayload);
    if (!created) {
      throw new Error('Failed to create matching summary');
    }
    return created;
  }

  async deleteSummary(id: string) {
    if (!id) {
      throw new Error('id is required');
    }
    await this.repo.delete(id);
  }
}
