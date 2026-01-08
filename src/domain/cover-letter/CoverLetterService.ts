import { CoverLetterRepository } from './CoverLetterRepository';
import type { CoverLetter, CoverLetterCreateInput, CoverLetterUpdateInput } from './CoverLetter';
// import { loadLazy } from '@/data/graphql/lazy'

export class CoverLetterService {
  constructor(private repo = new CoverLetterRepository()) {}

  async getFullCoverLetter(id: string): Promise<CoverLetter | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }

  async listCoverLettersByUser(userId: string): Promise<CoverLetter[]> {
    return this.repo.listByUser(userId);
  }

  async createCoverLetter(input: CoverLetterCreateInput): Promise<CoverLetter | null> {
    return this.repo.create({
      ...input,
      ...(input.jobId === null && { jobId: undefined }),
      tone: normalizeText(input.tone),
      content: normalizeText(input.content),
    });
  }

  async updateCoverLetter(input: CoverLetterUpdateInput): Promise<CoverLetter | null> {
    return this.repo.update({
      ...input,
      ...(input.jobId === null && { jobId: undefined }),
      ...(input.tone !== undefined && { tone: normalizeText(input.tone) }),
      ...(input.content !== undefined && { content: normalizeText(input.content) }),
    });
  }

  async deleteCoverLetter(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  createDraftCoverLetter(userId: string, jobId?: string | null): CoverLetterCreateInput {
    const normalizedJobId = jobId ?? undefined;
    return {
      userId,
      ...(normalizedJobId && { jobId: normalizedJobId }),
      tone: '',
      content: '',
    };
  }
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? '';
}
