import type {
  MatchingSummary,
  MatchingSummaryCreateInput,
  MatchingSummaryUpdateInput,
} from './MatchingSummary';
import { MatchingSummaryRepository } from './MatchingSummaryRepository';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';

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

export function mapMatchingSummaryResult(
  result: MatchingSummaryResult
): Omit<MatchingSummaryCreateInput, 'userId' | 'jobId'> {
  const normalized: Omit<MatchingSummaryCreateInput, 'userId' | 'jobId'> = {
    overallScore: typeof result.overallScore === 'number' ? result.overallScore : 0,
    scoreBreakdown: JSON.stringify(result.scoreBreakdown || {
      skillFit: 0,
      experienceFit: 0,
      interestFit: 0,
      edge: 0,
    }),
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
  constructor(private repo = new MatchingSummaryRepository()) {}

  async getById(id: string) {
    return this.repo.get(id);
  }

  async getByContext(context: MatchingSummaryContext) {
    if (!context.userId || !context.jobId) {
      throw new Error('userId and jobId are required');
    }
    return this.repo.findByContext(context.userId, context.jobId, context.companyId);
  }

  async listByJob(jobId: string) {
    if (!jobId) {
      throw new Error('jobId is required');
    }
    return this.repo.listByJob(jobId);
  }

  async upsertSummary(params: UpsertMatchingSummaryInput): Promise<MatchingSummary> {
    const { userId, jobId, companyId, summary } = params;
    if (!userId || !jobId) {
      throw new Error('userId and jobId are required to upsert matching summary');
    }

    const existing = await this.repo.findByContext(userId, jobId, companyId);
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
