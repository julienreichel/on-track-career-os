import { CompanyRepository } from './CompanyRepository'
import type { Company } from './Company';
// import { loadLazy } from '@/data/graphql/lazy'

export class CompanyService {
  constructor(private repo = new CompanyRepository()) {}

  async getFullCompany(id: string): Promise<Company | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
