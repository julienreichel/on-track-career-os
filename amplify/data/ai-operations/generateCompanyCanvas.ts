import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

const SYSTEM_PROMPT = `You are a strategy consultant building a Business Model Canvas.
Use only the provided company profile and notes.
Return concise bullet points (<= 20 words) for each of the 9 canonical blocks.
Leave blocks empty when the source contains no data.`;

const OUTPUT_SCHEMA = `{
  "companyName": "string",
  "customerSegments": ["string"],
  "valuePropositions": ["string"],
  "channels": ["string"],
  "customerRelationships": ["string"],
  "revenueStreams": ["string"],
  "keyResources": ["string"],
  "keyActivities": ["string"],
  "keyPartners": ["string"],
  "costStructure": ["string"],
  "analysisSummary": "string",
  "confidence": 0.8
}`;

export interface GenerateCompanyCanvasInput {
  companyProfile: Record<string, unknown>;
  additionalNotes?: string[];
}

export interface GenerateCompanyCanvasOutput {
  companyName: string;
  customerSegments: string[];
  valuePropositions: string[];
  channels: string[];
  customerRelationships: string[];
  revenueStreams: string[];
  keyResources: string[];
  keyActivities: string[];
  keyPartners: string[];
  costStructure: string[];
  analysisSummary: string;
  confidence: number;
}

const MAX_BLOCK_ENTRIES = 8;
const DEFAULT_CONFIDENCE = 0.6;
const JSON_INDENT_SPACES = 2;

const BLOCK_KEYS = [
  'customerSegments',
  'valuePropositions',
  'channels',
  'customerRelationships',
  'revenueStreams',
  'keyResources',
  'keyActivities',
  'keyPartners',
  'costStructure',
] as const;

type BlockKey = (typeof BLOCK_KEYS)[number];

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    const text = sanitizeString(entry);
    if (text && !seen.has(text)) {
      seen.add(text);
      items.push(text);
    }
  }
  return items.slice(0, MAX_BLOCK_ENTRIES);
}

function clampConfidence(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_CONFIDENCE;
  }
  return Math.max(0, Math.min(1, value));
}

function validateOutput(raw: Record<string, unknown>): GenerateCompanyCanvasOutput {
  const normalized: Record<string, unknown> = {};
  BLOCK_KEYS.forEach((key) => {
    normalized[key] = sanitizeArray(raw[key]);
  });

  return {
    companyName: sanitizeString(raw.companyName),
    ...(normalized as Record<BlockKey, string[]>),
    analysisSummary: sanitizeString(raw.analysisSummary),
    confidence: clampConfidence(raw.confidence),
  };
}

export const handler = async (event: { arguments: GenerateCompanyCanvasInput }) => {
  return withAiOperationHandlerObject(
    'generateCompanyCanvas',
    event,
    (args) => {
      const userPrompt = `Build the Business Model Canvas using only the provided structured data.

Company Profile:
${JSON.stringify(args.companyProfile, null, JSON_INDENT_SPACES)}

Additional Notes:
${JSON.stringify(args.additionalNotes ?? [], null, JSON_INDENT_SPACES)}

Return ONLY JSON:
${OUTPUT_SCHEMA}`;

      return invokeAiWithRetry({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'generateCompanyCanvas',
      });
    },
    (args) => ({
      companyName: args.companyProfile?.companyName,
      notesPreview: truncateForLog(JSON.stringify(args.additionalNotes ?? [])),
    })
  );
};
