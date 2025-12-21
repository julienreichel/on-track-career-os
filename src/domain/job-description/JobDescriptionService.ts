import { JobDescriptionRepository } from './JobDescriptionRepository'
import type { JobDescription } from './JobDescription';
// import { loadLazy } from '@/data/graphql/lazy'

export class JobDescriptionService {
  constructor(private repo = new JobDescriptionRepository()) {}

  async getFullJobDescription(id: string): Promise<JobDescription | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
