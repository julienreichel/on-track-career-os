/**
 * Company canvas generation types - re-exported from the Lambda definition
 * @see amplify/data/ai-operations/generateCompanyCanvas.ts
 */

import type {
  GenerateCompanyCanvasInput as LambdaGenerateCompanyCanvasInput,
  GenerateCompanyCanvasOutput,
} from '@amplify/data/ai-operations/generateCompanyCanvas';

export type GeneratedCompanyCanvasInput = LambdaGenerateCompanyCanvasInput;
export type GeneratedCompanyCanvas = GenerateCompanyCanvasOutput;

export function isGeneratedCompanyCanvas(value: unknown): value is GeneratedCompanyCanvas {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as GeneratedCompanyCanvas;
  return (
    typeof candidate.companyName === 'string' &&
    Array.isArray(candidate.customerSegments) &&
    typeof candidate.analysisSummary === 'string' &&
    typeof candidate.confidence === 'number'
  );
}
