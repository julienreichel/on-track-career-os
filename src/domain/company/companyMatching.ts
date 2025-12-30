import type { Company, CompanyUpdateInput } from './Company';
import { normalizeStringArray } from './companyUtils';
import type { CompanyAnalysisResult } from '@/domain/ai-operations/CompanyAnalysis';

const COMPANY_SUFFIXES = ['inc', 'inc.', 'llc', 'ltd', 'ltda', 'co', 'corp', 'corporation', 'sa', 'ag'];

export function normalizeCompanyName(name?: string | null) {
  if (!name) {
    return '';
  }
  let normalized = name.trim().toLowerCase();
  if (!normalized) {
    return '';
  }
  normalized = normalized.replace(/[.,]/g, ' ');
  for (const suffix of COMPANY_SUFFIXES) {
    const pattern = new RegExp(`\\b${suffix}$`);
    normalized = normalized.replace(pattern, '');
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

export function mergeCompanyProfile(
  existing: Company,
  profile: CompanyAnalysisResult['companyProfile']
) {
  const update: Partial<CompanyUpdateInput> = {};

  const assignIfEmpty = (key: keyof Company, value: string | null | undefined) => {
    if (!value) {
      return;
    }
    const current = (existing[key] as string | null | undefined)?.trim();
    if (!current) {
      (update as Record<string, unknown>)[key] = value;
    }
  };

  assignIfEmpty('industry', profile.industry);
  assignIfEmpty('sizeRange', profile.sizeRange);
  assignIfEmpty('website', profile.website);
  assignIfEmpty('description', profile.description);

  const mergeArrayField = (
    key: keyof CompanyUpdateInput,
    existingValues?: Array<string | null> | null,
    incoming?: Array<string | null> | null
  ) => {
    const merged = normalizeStringArray([...(existingValues ?? []), ...(incoming ?? [])]);
    const current = normalizeStringArray(existingValues ?? []);
    if (merged.length !== current.length || merged.some((value, index) => value !== current[index])) {
      (update as Record<string, unknown>)[key] = merged;
    }
  };

  mergeArrayField('productsServices', existing.productsServices, profile.productsServices);
  mergeArrayField('targetMarkets', existing.targetMarkets, profile.targetMarkets);
  mergeArrayField('customerSegments', existing.customerSegments, profile.customerSegments);

  return update;
}
