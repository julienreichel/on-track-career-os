import { PersonalCanvasRepository } from './PersonalCanvasRepository';
import { AiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';
import type { PersonalCanvas } from './PersonalCanvas';
import type { PersonalCanvasInput } from '@/domain/ai-operations/PersonalCanvas';
// import { loadLazy } from '@/data/graphql/lazy'

export class PersonalCanvasService {
  constructor(
    private repo = new PersonalCanvasRepository(),
    private aiRepo = new AiOperationsRepository()
  ) {}

  async getFullPersonalCanvas(id: string): Promise<PersonalCanvas | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }

  /**
   * Generate Personal Canvas using AI operation
   * @param input - User profile, experiences, and stories
   * @returns Generated PersonalCanvas from AI
   */
  async regenerateCanvas(input: PersonalCanvasInput): Promise<PersonalCanvas> {
    return await this.aiRepo.generatePersonalCanvas(input);
  }
}
