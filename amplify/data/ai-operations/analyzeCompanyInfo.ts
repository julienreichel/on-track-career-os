import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You are a market intelligence analyst. Extract only explicit facts about the company.
Return JSON describing the company profile (identity + offerings).
Never invent data. Leave strings empty and arrays [] when not present.`;

const OUTPUT_SCHEMA = `{
  "companyProfile": {
    "companyName": "string",
    "industry": "string",
    "sizeRange": "string",
    "website": "string",
    "productsServices": ["string"],
    "targetMarkets": ["string"],
    "customerSegments": ["string"],
    "description": "string"
  },
  "confidence": 0.8
}`;

export interface AnalyzeCompanyInfoInput {
  companyName: string;
  industry?: string;
  size?: string;
  rawText: string;
  jobContext?: {
    title?: string;
    summary?: string;
  };
}

export interface AnalyzeCompanyInfoOutput {
  companyProfile: {
    companyName: string;
    industry: string;
    sizeRange: string;
    website: string;
    productsServices: string[];
    targetMarkets: string[];
    customerSegments: string[];
    description: string;
    rawNotes: string;
  };
  confidence: number;
}

const CONFIDENCE_FALLBACK = 0.55;

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const list: string[] = [];
  for (const entry of value) {
    const text = sanitizeString(entry);
    if (text && !seen.has(text)) {
      seen.add(text);
      list.push(text);
    }
  }
  return list;
}

function clampConfidence(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return CONFIDENCE_FALLBACK;
  }
  return Math.max(0, Math.min(1, value));
}

function validateOutput(raw: Record<string, unknown>): AnalyzeCompanyInfoOutput {
  const profile = (raw.companyProfile ?? {}) as Record<string, unknown>;

  return {
    companyProfile: {
      companyName: sanitizeString(profile.companyName),
      industry: sanitizeString(profile.industry),
      sizeRange: sanitizeString(profile.sizeRange),
      website: sanitizeString(profile.website),
      productsServices: sanitizeArray(profile.productsServices),
      targetMarkets: sanitizeArray(profile.targetMarkets),
      customerSegments: sanitizeArray(profile.customerSegments),
      description: sanitizeString(profile.description),
      rawNotes: sanitizeString(profile.rawNotes),
    },
    confidence: clampConfidence(raw.confidence),
  };
}

function buildUserPrompt(args: AnalyzeCompanyInfoInput) {
  const jobSection = args.jobContext
    ? `Job Context:
Title: ${args.jobContext.title ?? ''}
Summary: ${args.jobContext.summary ?? ''}`
    : '';

  return `Analyze the following company information. Extract only explicitly stated facts.

Company Name: ${args.companyName}
Industry: ${args.industry ?? ''}
Size: ${args.size ?? ''}
${jobSection}

Source:
"""
${args.rawText}
"""

Return JSON matching:
${OUTPUT_SCHEMA}`;
}

export const handler = async (event: { arguments: AnalyzeCompanyInfoInput }) => {
  return withAiOperationHandlerObject(
    'analyzeCompanyInfo',
    event,
    async (args) => {
      if (!args.rawText?.trim()) {
        throw new Error('rawText is required');
      }
      const userPrompt = buildUserPrompt(args);
      const output = await invokeAiWithRetry({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'analyzeCompanyInfo',
      });
      return {
        ...output,
        companyProfile: {
          ...output.companyProfile,
          rawNotes: sanitizeString(args.rawText),
        },
      };
    },
    (args) => ({
      companyName: args.companyName,
      preview: truncateForLog(args.rawText),
    })
  );
};
