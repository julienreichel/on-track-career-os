import { SpeechBlockRepository } from './SpeechBlockRepository';
import type { SpeechBlock, SpeechBlockCreateInput, SpeechBlockUpdateInput } from './SpeechBlock';
// import { loadLazy } from '@/data/graphql/lazy'

export class SpeechBlockService {
  constructor(private repo = new SpeechBlockRepository()) {}

  async getFullSpeechBlock(id: string): Promise<SpeechBlock | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }

  async listSpeechBlocks(filter?: Record<string, unknown>): Promise<SpeechBlock[]> {
    return this.repo.list(filter);
  }

  async createSpeechBlock(input: SpeechBlockCreateInput): Promise<SpeechBlock | null> {
    return this.repo.create({
      ...input,
      elevatorPitch: normalizeText(input.elevatorPitch),
      careerStory: normalizeText(input.careerStory),
      whyMe: normalizeText(input.whyMe),
    });
  }

  async updateSpeechBlock(input: SpeechBlockUpdateInput): Promise<SpeechBlock | null> {
    return this.repo.update({
      ...input,
      ...(input.elevatorPitch !== undefined && {
        elevatorPitch: normalizeText(input.elevatorPitch),
      }),
      ...(input.careerStory !== undefined && { careerStory: normalizeText(input.careerStory) }),
      ...(input.whyMe !== undefined && { whyMe: normalizeText(input.whyMe) }),
    });
  }

  async deleteSpeechBlock(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  createDraftSpeechBlock(userId: string, jobId?: string | null): SpeechBlockCreateInput {
    return {
      userId,
      jobId: jobId ?? null,
      elevatorPitch: '',
      careerStory: '',
      whyMe: '',
    };
  }
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? '';
}
