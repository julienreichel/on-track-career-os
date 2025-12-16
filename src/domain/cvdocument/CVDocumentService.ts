import { CVDocumentRepository } from './CVDocumentRepository';
import type { CVDocument, CVDocumentUpdateInput } from './CVDocument';

/**
 * CV Document Service
 * Handles business logic for CV documents stored as Markdown
 */
export class CVDocumentService {
  constructor(private repo = new CVDocumentRepository()) {}

  /**
   * Get a CV document by ID
   */
  async getFullCVDocument(id: string): Promise<CVDocument | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    return item;
  }

  /**
   * Update a CV document
   * Used primarily for updating the Markdown content
   */
  async updateCVDocument(input: CVDocumentUpdateInput): Promise<CVDocument | null> {
    return this.repo.update(input);
  }
}
