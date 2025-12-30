import { describe, it, expect } from 'vitest';
import { isCompanyAnalysisResult } from '@/domain/ai-operations/CompanyAnalysis';

describe('CompanyAnalysis type guards', () => {
  it('returns true for valid analysis', () => {
    const valid = {
      companyProfile: {
        companyName: 'Acme',
        alternateNames: [],
        industry: '',
        sizeRange: '',
        headquarters: '',
        website: '',
        productsServices: [],
        targetMarkets: [],
        customerSegments: [],
        summary: '',
      },
      signals: {
        marketChallenges: [],
        internalPains: [],
        partnerships: [],
        hiringFocus: [],
        strategicNotes: [],
      },
      confidence: 0.8,
    };

    expect(isCompanyAnalysisResult(valid)).toBe(true);
  });

  it('returns false for malformed payloads', () => {
    expect(isCompanyAnalysisResult(null)).toBe(false);
    expect(isCompanyAnalysisResult({})).toBe(false);
    expect(
      isCompanyAnalysisResult({
        companyProfile: { companyName: 123, productsServices: [] },
        signals: { marketChallenges: [] },
        confidence: 'high',
      })
    ).toBe(false);
  });
});
