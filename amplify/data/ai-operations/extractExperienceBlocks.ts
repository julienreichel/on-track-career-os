import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AWS Lambda handler for ai.extractExperienceBlocks
 *
 * PURPOSE:
 * Transform raw experience text into structured Experience entities.
 * Extract: title, companyName, dates, responsibilities, tasks, status.
 *
 * @see docs/AI_Interaction_Contract.md - Operation 2
 */

type ExperienceType = 'work' | 'education' | 'volunteer' | 'project';
type ExperienceStatus = 'draft' | 'complete';

export interface ExperienceItemInput {
  experienceType: ExperienceType;
  rawBlock: string;
}

export interface ExtractExperienceBlocksInput {
  language: string;
  experienceItems: ExperienceItemInput[];
}

export interface ExtractedExperience {
  title: string;
  companyName: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
  tasks: string[];
  status: ExperienceStatus;
  experienceType: ExperienceType;
}

export interface ExtractExperienceBlocksOutput {
  experiences: ExtractedExperience[];
}

const EXPERIENCE_TYPES: ExperienceType[] = ['work', 'education', 'volunteer', 'project'];
const PRESENT_END_DATE = /(present|current|aujourd'hui)/i;
const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

const SYSTEM_PROMPT = `You extract structured experience data from raw blocks.
Return ONLY JSON matching the required schema. No markdown.
Never invent missing data.
Responsibilities and tasks must be written in the target language.
Proper nouns must stay unchanged.
Dates must be formatted as YYYY or YYYY-MM.`;

const OUTPUT_SCHEMA = `{
  "experiences": [
    {
      "title": "string",
      "companyName": "string",
      "startDate": "string",
      "endDate": "string",
      "responsibilities": ["string"],
      "tasks": ["string"],
      "status": "draft | complete",
      "experienceType": "work | education | volunteer | project"
    }
  ]
}`;

function buildUserPrompt(language: string, items: ExperienceItemInput[]): string {
  const blocks = items
    .map((item, index) => `[Item ${index + 1} | ${item.experienceType}]\n${item.rawBlock}`)
    .join('\n\n');

  return `Extract experiences from the following blocks.
Target language for responsibilities/tasks: ${language}

${blocks}

RULES:
- Extract only information explicitly stated in the text
- Do not invent or infer missing details
- Title/companyName are copied as-is (no translation unless obvious)
- Responsibilities/tasks must be translated to the target language without adding info
- Dates: extract only if explicit. If only a year is present, return that year string
- Date format must be YYYY or YYYY-MM (no month names)
- If end date is explicitly "present/current/aujourd'hui", return an empty string
- experienceType must match the input item type
- status is computed in code, still include the field in output

Return JSON with this exact structure:
${OUTPUT_SCHEMA}`;
}

function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function splitToArray(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  const byNewline = trimmed.split(/\n+/).map((entry) => entry.trim()).filter(Boolean);
  if (byNewline.length > 1) {
    return byNewline;
  }

  return trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return splitToArray(value);
  }

  return [];
}

function normalizeDateValue(value: string, treatPresentAsEmpty: boolean): string {
  if (!value) {
    return '';
  }

  if (treatPresentAsEmpty && PRESENT_END_DATE.test(value)) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }

  if (/^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }

  const monthYearMatch = value.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = MONTH_MAP[monthYearMatch[1].toLowerCase()];
    if (month) {
      return `${monthYearMatch[2]}-${month}-01`;
    }
  }

  return '';
}

function computeStatus(): ExperienceStatus {
  return 'draft';
}

function validateOutput(
  output: unknown,
  items: ExperienceItemInput[]
): ExtractExperienceBlocksOutput {
  const rawExperiences = Array.isArray((output as ExtractExperienceBlocksOutput)?.experiences)
    ? (output as ExtractExperienceBlocksOutput).experiences
    : [];

  const experiences = items.map((item, index) => {
    const raw = (rawExperiences[index] || {}) as Partial<ExtractedExperience>;
    const title = sanitizeString(raw.title);
    const companyName = sanitizeString(raw.companyName);
    const startDate = normalizeDateValue(sanitizeString(raw.startDate), false);
    const endDate = normalizeDateValue(sanitizeString(raw.endDate), true);
    const responsibilities = sanitizeStringArray(raw.responsibilities);
    const tasks = sanitizeStringArray(raw.tasks);
    const status = computeStatus();
    const experienceType = EXPERIENCE_TYPES.includes(item.experienceType)
      ? item.experienceType
      : 'work';

    return {
      title,
      companyName,
      startDate,
      endDate,
      responsibilities,
      tasks,
      status,
      experienceType,
    };
  });

  return { experiences };
}

export const handler = async (event: {
  arguments: ExtractExperienceBlocksInput;
}): Promise<ExtractExperienceBlocksOutput> => {
  return withAiOperationHandlerObject(
    'extractExperienceBlocks',
    event,
    async (args: ExtractExperienceBlocksInput) => {
      const userPrompt = buildUserPrompt(args.language, args.experienceItems);

      return invokeAiWithRetry<ExtractExperienceBlocksOutput>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: (output) => validateOutput(output, args.experienceItems),
        operationName: 'extractExperienceBlocks',
      });
    },
    (args: ExtractExperienceBlocksInput) => ({
      language: args.language,
      experienceItems:
        args.experienceItems.length > 1
          ? `${args.experienceItems.length} experience items`
          : truncateForLog(args.experienceItems[0]?.rawBlock || ''),
    })
  );
};
