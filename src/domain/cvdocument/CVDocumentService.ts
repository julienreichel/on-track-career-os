import { CVDocumentRepository } from './CVDocumentRepository';
import type { CVDocument } from './CVDocument';
// import { loadLazy } from '@/data/graphql/lazy'

export class CVDocumentService {
  constructor(private repo = new CVDocumentRepository()) {}

  async getFullCVDocument(id: string): Promise<CVDocument | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
