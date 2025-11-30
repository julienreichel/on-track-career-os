import { ExperienceRepository } from './ExperienceRepository';
import type { Experience } from './Experience';
// import { loadLazy } from '@/data/graphql/lazy'

export class ExperienceService {
  constructor(private repo = new ExperienceRepository()) {}

  async getFullExperience(id: string): Promise<Experience | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
