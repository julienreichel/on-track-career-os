import { JobRoleCardRepository } from './JobRoleCardRepository'
import type { JobRoleCard } from './JobRoleCard';
// import { loadLazy } from '@/data/graphql/lazy'

export class JobRoleCardService {
  constructor(private repo = new JobRoleCardRepository()) {}

  async getFullJobRoleCard(id: string): Promise<JobRoleCard | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
