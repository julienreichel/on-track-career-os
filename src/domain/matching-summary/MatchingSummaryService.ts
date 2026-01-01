import type {
  MatchingSummary,
  MatchingSummaryCreateInput,
  MatchingSummaryUpdateInput,
} from './MatchingSummary';
import { MatchingSummaryRepository } from './MatchingSummaryRepository';
import type { MatchingSummaryResult } from '@/domain/ai-operations/MatchingSummaryResult';

const SCORE_MIN = 0;
const SCORE_MAX = 100;

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

function clampScore(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
}

export function mapMatchingSummaryResult(
  result: MatchingSummaryResult
): Omit<MatchingSummaryCreateInput, 'userId' | 'jobId'> {
  const riskSource =
    result.riskMitigationPoints && result.riskMitigationPoints.length > 0
      ? result.riskMitigationPoints
      : (result as Record<string, unknown>)?.risks;

  const normalized: Omit<MatchingSummaryCreateInput, 'userId' | 'jobId'> = {
    summaryParagraph: sanitizeString(result.summaryParagraph),
    impactAreas: sanitizeArray(result.impactAreas),
    contributionMap: sanitizeArray(result.contributionMap),
    riskMitigationPoints: sanitizeArray(riskSource),
    generatedAt: sanitizeString(result.generatedAt) || new Date().toISOString(),
    needsUpdate: Boolean(result.needsUpdate),
  };

  const score = clampScore(result.userFitScore);
  if (typeof score === 'number') {
    normalized.userFitScore = score;
  }

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
