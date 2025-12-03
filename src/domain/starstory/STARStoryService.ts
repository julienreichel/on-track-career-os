import { STARStoryRepository } from './STARStoryRepository';
import type { STARStory } from './STARStory';
// import { loadLazy } from '@/data/graphql/lazy'

export class STARStoryService {
  constructor(private repo = new STARStoryRepository()) {}

  async getFullSTARStory(id: string): Promise<STARStory | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
