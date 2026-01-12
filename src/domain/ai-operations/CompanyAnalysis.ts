/**
 * Company analysis types - re-exported from the Lambda definition
 * @see amplify/data/ai-operations/analyzeCompanyInfo.ts
 */

import type {
  AnalyzeCompanyInfoInput as LambdaAnalyzeCompanyInfoInput,
  AnalyzeCompanyInfoOutput,
} from '@amplify/data/ai-operations/analyzeCompanyInfo';

export type AnalyzeCompanyInfoInput = LambdaAnalyzeCompanyInfoInput;
export type CompanyAnalysisResult = AnalyzeCompanyInfoOutput;

export function isCompanyAnalysisResult(value: unknown): value is CompanyAnalysisResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as CompanyAnalysisResult;
  return (
    typeof candidate.companyProfile?.companyName === 'string' &&
    Array.isArray(candidate.companyProfile?.productsServices)
  );
}
