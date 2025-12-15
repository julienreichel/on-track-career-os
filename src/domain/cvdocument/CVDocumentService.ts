import { CVDocumentRepository } from './CVDocumentRepository';
import type { CVDocument, CVDocumentUpdateInput } from './CVDocument';

export interface CVBlock {
  id: string;
  type: string;
  content: unknown;
  order: number;
}

export interface CVContentJSON {
  blocks?: CVBlock[];
  [key: string]: unknown;
}

export class CVDocumentService {
  constructor(private repo = new CVDocumentRepository()) {}

  async getFullCVDocument(id: string): Promise<CVDocument | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    return item;
  }

  /**
   * Add a new block to the CV document
   * @param cvId - CV document ID
   * @param block - Block to add (without order, will be appended)
   * @returns Updated CV document
   */
  async addBlock(cvId: string, block: Omit<CVBlock, 'order'>): Promise<CVDocument | null> {
    const cv = await this.repo.get(cvId);
    if (!cv) return null;

    const contentJSON = (cv.contentJSON as CVContentJSON) || {};
    const blocks = contentJSON.blocks || [];

    // Calculate next order (append to end)
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.order)) : -1;
    const newBlock: CVBlock = {
      ...block,
      order: maxOrder + 1,
    };

    const updatedContentJSON = {
      ...contentJSON,
      blocks: [...blocks, newBlock],
    };

    return await this.repo.update({
      id: cvId,
      contentJSON: updatedContentJSON,
    } as CVDocumentUpdateInput);
  }

  /**
   * Update an existing block in the CV document
   * @param cvId - CV document ID
   * @param blockId - Block ID to update
   * @param updates - Partial block updates
   * @returns Updated CV document
   */
  async updateBlock(
    cvId: string,
    blockId: string,
    updates: Partial<Omit<CVBlock, 'id'>>
  ): Promise<CVDocument | null> {
    const cv = await this.repo.get(cvId);
    if (!cv) return null;

    const contentJSON = (cv.contentJSON as CVContentJSON) || {};
    const blocks = contentJSON.blocks || [];

    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return null;

    const updatedBlocks = blocks.map((block, index) => {
      if (index !== blockIndex) return block;
      return { ...block, ...updates, id: block.id };
    });

    const updatedContentJSON = {
      ...contentJSON,
      blocks: updatedBlocks,
    };

    return await this.repo.update({
      id: cvId,
      contentJSON: updatedContentJSON,
    } as CVDocumentUpdateInput);
  }

  /**
   * Remove a block from the CV document
   * @param cvId - CV document ID
   * @param blockId - Block ID to remove
   * @returns Updated CV document
   */
  async removeBlock(cvId: string, blockId: string): Promise<CVDocument | null> {
    const cv = await this.repo.get(cvId);
    if (!cv) return null;

    const contentJSON = (cv.contentJSON as CVContentJSON) || {};
    const blocks = contentJSON.blocks || [];

    const updatedBlocks = blocks.filter((b) => b.id !== blockId);

    // Reorder remaining blocks to maintain sequential order
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    const updatedContentJSON = {
      ...contentJSON,
      blocks: reorderedBlocks,
    };

    return await this.repo.update({
      id: cvId,
      contentJSON: updatedContentJSON,
    } as CVDocumentUpdateInput);
  }

  /**
   * Reorder blocks in the CV document
   * @param cvId - CV document ID
   * @param blockIds - Array of block IDs in desired order
   * @returns Updated CV document
   */
  async reorderBlocks(cvId: string, blockIds: string[]): Promise<CVDocument | null> {
    const cv = await this.repo.get(cvId);
    if (!cv) return null;

    const contentJSON = (cv.contentJSON as CVContentJSON) || {};
    const blocks = contentJSON.blocks || [];

    // Create a map for quick lookup
    const blockMap = new Map(blocks.map((b) => [b.id, b]));

    // Reorder blocks based on blockIds array
    const reorderedBlocks = blockIds
      .map((id, index) => {
        const block = blockMap.get(id);
        if (!block) return null;
        return { ...block, order: index };
      })
      .filter((b): b is CVBlock => b !== null);

    const updatedContentJSON = {
      ...contentJSON,
      blocks: reorderedBlocks,
    };

    return await this.repo.update({
      id: cvId,
      contentJSON: updatedContentJSON,
    } as CVDocumentUpdateInput);
  }

  /**
   * Update the entire contentJSON of the CV document
   * @param cvId - CV document ID
   * @param contentJSON - Complete contentJSON object
   * @returns Updated CV document
   */
  async updateContent(cvId: string, contentJSON: CVContentJSON): Promise<CVDocument | null> {
    const cv = await this.repo.get(cvId);
    if (!cv) return null;

    return await this.repo.update({
      id: cvId,
      contentJSON,
    } as CVDocumentUpdateInput);
  }
}
