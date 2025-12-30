import { describe, it, expect } from 'vitest';
import { isGeneratedCompanyCanvas } from '@/domain/ai-operations/CompanyCanvasResult';

describe('CompanyCanvasResult type guard', () => {
  it('accepts valid company canvas payload', () => {
    const valid = {
      companyName: 'Acme',
      customerSegments: [],
      valuePropositions: [],
      channels: [],
      customerRelationships: [],
      revenueStreams: [],
      keyResources: [],
      keyActivities: [],
      keyPartners: [],
      costStructure: [],
      analysisSummary: 'Summary',
      confidence: 0.6,
    };

    expect(isGeneratedCompanyCanvas(valid)).toBe(true);
  });

  it('rejects invalid payloads', () => {
    expect(isGeneratedCompanyCanvas(null)).toBe(false);
    expect(
      isGeneratedCompanyCanvas({
        companyName: 'Acme',
        customerSegments: {},
        analysisSummary: null,
        confidence: 'high',
      })
    ).toBe(false);
  });
});
