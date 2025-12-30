import { describe, it, expect } from 'vitest';
import { mergeCompanyProfile, normalizeCompanyName } from '@/domain/company/companyMatching';
import type { Company } from '@/domain/company/Company';
import type { CompanyAnalysisResult } from '@/domain/ai-operations/CompanyAnalysis';

describe('companyMatching helpers', () => {
  describe('normalizeCompanyName', () => {
    it('normalizes case and suffixes', () => {
      expect(normalizeCompanyName('  Acme Inc.  ')).toBe('acme');
      expect(normalizeCompanyName('GLOBAL FREIGHT LLC')).toBe('global freight');
    });

    it('returns empty string for invalid input', () => {
      expect(normalizeCompanyName('')).toBe('');
      expect(normalizeCompanyName(null)).toBe('');
    });
  });

  describe('mergeCompanyProfile', () => {
    const baseCompany = {
      id: 'company-1',
      companyName: 'Acme',
      industry: '',
      sizeRange: '',
      website: '',
      productsServices: ['API'],
      targetMarkets: [],
      customerSegments: [],
      description: '',
    } as unknown as Company;

    const profile = {
      companyName: 'Acme',
      industry: 'Software',
      sizeRange: '201-500',
      website: 'https://acme.com',
      productsServices: ['Automation'],
      targetMarkets: ['Fintech'],
      customerSegments: ['Startups'],
      description: 'Platform company',
    } as CompanyAnalysisResult['companyProfile'];

    it('fills empty scalar fields', () => {
      const update = mergeCompanyProfile(baseCompany, profile);
      expect(update.industry).toBe('Software');
      expect(update.sizeRange).toBe('201-500');
      expect(update.website).toBe('https://acme.com');
      expect(update.description).toBe('Platform company');
    });

    it('merges array fields without duplicates', () => {
      const update = mergeCompanyProfile(baseCompany, profile);
      expect(update.productsServices).toEqual(['API', 'Automation']);
      expect(update.targetMarkets).toEqual(['Fintech']);
      expect(update.customerSegments).toEqual(['Startups']);
    });

    it('does not override existing scalar values', () => {
      const existing = {
        ...baseCompany,
        industry: 'Existing',
      } as Company;
      const update = mergeCompanyProfile(existing, profile);
      expect(update.industry).toBeUndefined();
    });
  });
});
