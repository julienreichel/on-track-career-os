import { describe, it, expect } from 'vitest';
import { COMPANY_CANVAS_BLOCKS } from '@/domain/company-canvas/canvasBlocks';

describe('COMPANY_CANVAS_BLOCKS config', () => {
  it('contains all nine Business Model Canvas blocks in order', () => {
    expect(COMPANY_CANVAS_BLOCKS).toEqual([
      'customerSegments',
      'valuePropositions',
      'channels',
      'customerRelationships',
      'revenueStreams',
      'keyResources',
      'keyActivities',
      'keyPartners',
      'costStructure',
    ]);
  });

  it('contains unique keys', () => {
    const uniqueKeys = new Set(COMPANY_CANVAS_BLOCKS);
    expect(uniqueKeys.size).toBe(9);
  });
});
