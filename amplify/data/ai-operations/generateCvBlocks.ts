import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

/**
 * AWS Lambda handler for ai.generateCvBlocks
 *
 * PURPOSE:
 * Generate a job-tailored CV as structured sections (blocks) from user profile,
 * experiences, stories, skills, and optional job description.
 *
 * CONTRACT:
 * - Never invent new experiences or employers
 * - Return structured JSON blocks only
 * - Auto-adjust length (~2 pages): many experiences → shorter, few → richer
 * - Tailor to job description if provided
 *
 * @see docs/AI_Interaction_Contract.md - Operation 11
 */

// Configuration
const DEFAULT_SECTIONS = [
  'summary',
  'experience',
  'skills',
  'languages',
  'certifications',
  'interests',
];
const JSON_INDENT_SPACES = 2;
const LOG_TRUNCATE_LENGTH = 50;

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You are an assistant that generates a tailored CV as a sequence of structured sections.

GOAL:
- Produce a coherent CV that fits in approximately 2 pages.
- Use ONLY the information provided in the input profile, experiences, stories, and job description.
- DO NOT invent new experiences, employers, or responsibilities.
- You MAY slightly infer impact phrasing (achievements, outcomes) as long as it clearly follows from the input.

CONTENT & STRUCTURE RULES:
- The CV is made of ordered sections ("blocks").
- Each section has:
  - type
  - optional title
  - content (plain text, basic markdown: bullets, bold, emphasis)
  - optional experienceId for experience-related blocks
- Use only these section types:
  - "summary"
  - "experience"
  - "education"
  - "skills"
  - "languages"
  - "certifications"
  - "interests"
  - "custom"

- For "summary":
  - 3–5 concise sentences describing the user, aligned with the job if a job description is provided.
- For "experience"/"education":
  - One block per selected experience.
  - Each block should be concise and focused on impact, using achievements/KPIs if available.
- For "skills", "languages", "certifications", "interests":
  - Summarize and group items logically into a short paragraph or bullet-like sentence list inside content.

LENGTH HEURISTIC:
- Aim for ~2 pages of CV content in total.
- If there are MANY experiences (for example 7 or more), shorten each experience description.
- If there are FEW experiences (for example 1–3), use richer narrative per experience.
- Prefer clarity and focus over verbosity.

TAILORING:
- If a job description is provided:
  - Emphasize experiences, skills, and achievements that best match the role.
  - Reorder experience blocks to put the most relevant first.
- If no job description is provided:
  - Produce a generic but coherent CV that reflects the user's overall profile.

OUTPUT RULES:
- Return ONLY valid JSON, no markdown or extra text.
- Respect the exact JSON schema provided in the user prompt.`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "sections": [
    {
      "type": "summary" | "experience" | "education" | "skills" | "languages" | "certifications" | "interests" | "custom",
      "title": "string | null",
      "content": "string",
      "experienceId": "string | null"
    }
  ]
}`;

// Type definitions matching AI Interaction Contract
export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'interests'
  | 'custom';

export interface CVSection {
  type: SectionType;
  title?: string | null;
  content: string;
  experienceId?: string | null;
}

export interface GenerateCvBlocksOutput {
  sections: CVSection[];
}

export interface UserProfileInput {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  goals?: string[];
  aspirations?: string[];
  personalValues?: string[];
  strengths?: string[];
}

export interface ExperienceInput {
  id: string;
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  tasks?: string[];
}

export interface StoryInput {
  experienceId: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  achievements?: string[];
  kpiSuggestions?: string[];
}

export interface GenerateCvBlocksInput {
  userProfile: UserProfileInput;
  selectedExperiences: ExperienceInput[];
  stories?: StoryInput[];
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  interests?: string[];
  sectionsToGenerate?: SectionType[];
  jobDescription?: string | null;
}

/**
 * Validate section type and map invalid types to closest valid type
 */
function validateSectionType(type: string): SectionType {
  const validTypes: SectionType[] = [
    'summary',
    'experience',
    'education',
    'skills',
    'languages',
    'certifications',
    'interests',
    'custom',
  ];

  if (validTypes.includes(type as SectionType)) {
    return type as SectionType;
  }

  // Map common variations to valid types
  const typeMap: Record<string, SectionType> = {
    profile: 'summary',
    about: 'summary',
    bio: 'summary',
    work: 'experience',
    employment: 'experience',
    'work experience': 'experience',
    school: 'education',
    training: 'education',
    'technical skills': 'skills',
    competencies: 'skills',
    language: 'languages',
    certificates: 'certifications',
    hobbies: 'interests',
    other: 'custom',
  };

  const mapped = typeMap[type.toLowerCase()];
  if (mapped) {
    console.warn(`Mapped invalid section type "${type}" to "${mapped}"`);
    return mapped;
  }

  // Default to custom if no mapping found
  console.warn(`Unknown section type "${type}", defaulting to "custom"`);
  return 'custom';
}

/**
 * Validate single section and apply fallback rules
 */
function validateSection(section: Partial<CVSection>): CVSection | null {
  // Section must have type and content at minimum
  if (!section.type || typeof section.content !== 'string') {
    console.warn('Dropping section missing required fields:', section);
    return null;
  }

  // Validate and potentially fix type
  const validatedType = validateSectionType(section.type);

  // Truncate extremely verbose content (>5000 chars = likely too long)
  const MAX_SECTION_LENGTH = 5000;
  let content = section.content;
  if (content.length > MAX_SECTION_LENGTH) {
    console.warn(
      `Section content too long (${content.length} chars), truncating to ${MAX_SECTION_LENGTH}`
    );
    content = content.substring(0, MAX_SECTION_LENGTH) + '...';
  }

  return {
    type: validatedType,
    title: section.title || null,
    content,
    experienceId: section.experienceId || null,
  };
}

/**
 * Validate and apply fallback rules from AIC
 */
function validateOutput(parsedOutput: Partial<GenerateCvBlocksOutput>): GenerateCvBlocksOutput {
  // If sections is missing or not an array, return empty sections
  if (!Array.isArray(parsedOutput.sections)) {
    console.warn('No sections array found in output, returning empty array');
    return { sections: [] };
  }

  // Validate each section and filter out invalid ones
  const validatedSections = parsedOutput.sections
    .map((section) => validateSection(section))
    .filter((section): section is CVSection => section !== null);

  return {
    sections: validatedSections,
  };
}

/**
 * Build user prompt from input data
 */
function buildUserPrompt(input: GenerateCvBlocksInput): string {
  const sectionsToGenerate = input.sectionsToGenerate || DEFAULT_SECTIONS;

  return `Generate a tailored CV as ordered sections based on the following data.

User profile:
${JSON.stringify(input.userProfile, null, JSON_INDENT_SPACES)}

Selected experiences:
${JSON.stringify(input.selectedExperiences, null, JSON_INDENT_SPACES)}

Stories, achievements, and KPIs (optional, may be empty):
${JSON.stringify(input.stories || [], null, JSON_INDENT_SPACES)}

Skills:
${JSON.stringify(input.skills || [], null, JSON_INDENT_SPACES)}

Languages:
${JSON.stringify(input.languages || [], null, JSON_INDENT_SPACES)}

Certifications:
${JSON.stringify(input.certifications || [], null, JSON_INDENT_SPACES)}

Interests:
${JSON.stringify(input.interests || [], null, JSON_INDENT_SPACES)}

Job description (optional, may be empty):
${input.jobDescription || 'None provided'}

Sections to generate (ordered list of section types):
${JSON.stringify(sectionsToGenerate, null, JSON_INDENT_SPACES)}

Remember:
- Use ONLY the information provided above.
- Respect the requested section order.
- Keep the overall length around 2 pages.
- Use shorter descriptions when many experiences are selected; use richer descriptions when there are only a few.

Return ONLY a JSON object with this exact structure:
${OUTPUT_SCHEMA}`;
}

/**
 * Prepare input for logging (truncate long arrays/strings)
 */
function prepareInputForLogging(input: GenerateCvBlocksInput): Record<string, unknown> {
  return {
    userProfile: {
      id: input.userProfile.id,
      fullName: input.userProfile.fullName,
      headline: input.userProfile.headline,
    },
    experienceCount: input.selectedExperiences.length,
    storyCount: input.stories?.length || 0,
    skillCount: input.skills?.length || 0,
    hasJobDescription: !!input.jobDescription,
    jobDescriptionPreview: input.jobDescription
      ? truncateForLog(input.jobDescription, LOG_TRUNCATE_LENGTH)
      : null,
    sectionsToGenerate: input.sectionsToGenerate || DEFAULT_SECTIONS,
  };
}

/**
 * Main Lambda handler
 */
export const handler = async (event: { arguments: GenerateCvBlocksInput }): Promise<string> => {
  return withAiOperationHandler(
    'generateCvBlocks',
    event,
    async (args) => {
      const userPrompt = buildUserPrompt(args);
      return invokeAiWithRetry<GenerateCvBlocksOutput>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
        operationName: 'generateCvBlocks',
      });
    },
    prepareInputForLogging
  );
};
