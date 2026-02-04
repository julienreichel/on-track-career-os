import { invokeBedrock } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';
import { formatAiInputContext } from './utils/promptFormat';
import type {
  JobDescription,
  MatchingSummaryContext,
  CompanyProfile,
  PersonalCanvas,
  Experience,
  Profile,
  SpeechStory,
} from './types/schema-types';

/**
 * AI Operation: generateCv
 *
 * Generates a complete CV in Markdown format based on user profile, experiences, and optional job description.
 * Follows CV best practices and tailors content when a job description is provided.
 *
 * Input Schema:
 * - profile: Object containing user's profile information
 * - experiences: Array of experience objects to include
 * - stories: Optional array of STAR stories
 * - personalCanvas: Optional personal canvas context
 * - jobDescription: Optional job description for tailoring
 * - matchingSummary: Optional matching summary for tailoring
 * - company: Optional company summary context
 * - templateMarkdown: Optional Markdown exemplar to loosely match structure/style
 *
 * Output Schema:
 * - Returns complete CV as plain Markdown text
 *
 * NOTE: Types are imported from types/schema-types.ts to maintain DRY principle
 * and ensure consistency with GraphQL schema definitions.
 */

interface GenerateCvInput {
  language: 'en';
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  personalCanvas?: PersonalCanvas;
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
  templateMarkdown?: string;
}

/**
 * System prompt for CV generation
 */
const SYSTEM_PROMPT = `You are an expert CV writer and career coach.
Your task is to generate a professional, ATS-optimized CV in Markdown format with high specificity, strong professional identity, and measurable achievements.

## CRITICAL REQUIREMENTS:
1. Output ONLY valid Markdown - no additional commentary
2. Do NOT include explanations, commentary, or labels.
3. Final CV must look like a real human-written CV, not raw database output.
4. If matchingSummary is provided, use its tailoringTips/strengths to guide emphasis.
5. If company summary is provided, use only summary-level info and do not invent details.
6. If template examplar is provided, follow the provided layout.
7. NEVER invent experiences, skills or certifications, use ONLY provided data

## INFORMATION-TRANSFORMATION PRINCIPLES
### **A. Preserve Uniqueness Over Compression**
You MUST prioritize specific achievements, measurable outcomes, technical depth, and strong positioning **over shallow summarization**.

Never replace real achievements with generic language.
Condense wording, NOT meaning.

### **B. Achievements & STAR Stories**
From STAR stories and tasks:
* Pull out quantitative achievements
* Convert multi-line STAR content into 1-line bullets
* Focus on RESULT + IMPACT
* Do NOT throw away metrics, revenue numbers, adoption rates, retention, team size, contract values, project scale, or invention details
* If there are more STAR achievements than bullet space, combine multiple achievements into composite bullets rather than dropping them completely.

If achievement indicators exist, you MUST use them.

### **C. Responsibilities vs Impact**
Never list raw responsibilities.
Rewrite each bullet as:

**action → outcome → metric → context**

## CV STRUCTURE RULES
1. **Header + Contact**
   * Name
   * Main title / headline
   * Location | Contacts
   * Work authorization if provided | Raw social links if relevant (e.g. linkedin.com/in/fullname/)
2. **Professional Summary (3-5 compact lines)**
   * Identity + specialization
   * Core domain expertise
   * Leadership scale (team size, technology scale)
   * Business value delivered
   * Include: industry domain, leadership scale, architecture expertise, product creation, and business outcomes.
   * Avoid subjective adjectives. Use factual strength indicators instead (metrics, scale, scope, outcomes).
3. **Work Experience (reverse chronological)**
   For each role:
   * Job title
   * Company | Dates (Formated as Month Year, i.e. Nov 2021)
   * 4-7 bullets MAX, For senior roles (5+ years), produce 6-7 bullets whenever data supports it.
   * Each bullet must show IMPACT (not duties)
   * !!NEVER invent experience, use ONLY the provided data
4. **Education**
   * Clean, chronological.
5. **Skills**
   * Group skills into categories (Technical, Languages, Soft, Tools).
   * Remove irrelevant ones.
   * Skills section must reflect breadth; include 12-18 skills grouped into categories
6. **Certifications, Languages, Interests**
   * Only if provided meaningful.

## LANGUAGE GUIDELINES
Use strong verbs:
* Led, Architected, Built, Launched, Delivered, Reduced, Enabled, Scaled, Automated, Designed, Directed, Implemented, Modernized, Improved.

Avoid weak / generic verbs:
 * Helped, Worked on, Assisted, Participated, generic duty verbs.

## REQUIRED BULLET STYLE RULES
* One line each (use commas or “;” to combine multiple outcomes)
* Unique phrasing per role (do NOT repeat bullet templates).
* Quantify wherever possible
* Avoid vague language
* Avoid buzzwords
* Avoid empty filler

## STRICT DATA-USAGE RULES
* Use ONLY information provided in input
* NEVER invent achievements
* If data is missing, omit field
* If a section is empty, do not fabricate it

## CONTENT PRIORITY (TOP-DOWN)
* Business impact / revenue / growth
* Architecture + delivery ownership
* Leadership & coaching
* Technical stack & methods
* Day-to-day tasks

## DO NOT:
* Repeat responsibilities twice
* Copy STAR story text verbatim
* Dump full lists of tasks
* Output lists longer than 6 bullets
* Produce generic summaries
* Remove valid metrics
* Output job descriptions or roles not supplied

## LENGTH REQUIREMENT
Target: 2 pages max of Markdown content, i,e, 70 lignes of text.
`;

/**
 * Build the user prompt for CV generation
 */
function buildUserPrompt(input: GenerateCvInput): string {
  const tailoring = resolveTailoringContext(input);
  const jobDescription = tailoring?.jobDescription ?? null;
  const matchingSummary = tailoring?.matchingSummary ?? null;
  const company = tailoring?.company ?? null;

  let prompt = 'Generate a professional, CONCISE CV in Markdown format.\n\n';
  prompt += 'SYNTHESIS INSTRUCTIONS:\n';
  prompt += '- CONDENSE verbose descriptions into impactful 1-line bullets\n';
  prompt += '- EXTRACT key metrics and achievements from STAR stories\n';
  prompt += '- ELIMINATE redundant or generic statements\n';
  prompt += '- SELECT only the most relevant skills/interests (not all)\n';
  prompt += '- COMBINE similar responsibilities into single points\n';
  prompt += '- Professional summary: 2-3 lines maximum\n\n';

  prompt += `${formatAiInputContext({
    language: input.language,
    profile: input.profile,
    experiences: input.experiences,
    stories: input.stories,
    personalCanvas: input.personalCanvas,
    jobDescription,
    matchingSummary,
    company,
  })}\n\n`;

  prompt += `SKILL CURATION:\n`;
  prompt += `- Organize skills into 2-4 categories (e.g., Technical, Languages, Soft Skills)\n`;
  prompt += `- Select only relevant skills; omit casual or redundant ones\n\n`;

  prompt += `INTERESTS:\n`;
  prompt += `- If interests are provided, choose only 3-5 professional/relevant ones\n`;
  prompt += `- Omit casual hobbies\n\n`;

  if (jobDescription) {
    prompt += `TAILORING INSTRUCTIONS:\n`;
    prompt += `- Prioritize experiences and skills matching this job description\n`;
    prompt += `- Use keywords from the job posting\n`;
    prompt += `- Emphasize relevant achievements from STAR stories\n`;
    prompt += `- Adjust professional summary to align with role\n\n`;
  }

  prompt += `CRITICAL REMINDERS:\n`;
  prompt += `- Use ONLY the information provided above - do not invent data\n`;
  prompt += `- Keep the CV CONCISE (1-2 pages worth)\n`;
  prompt += `- Separate Education from Work Experience\n`;
  prompt += `- Transform verbose input into professional, impactful output\n`;

  if (input.templateMarkdown?.trim()) {
    prompt += `\n## TEMPLATE EXEMPLAR (MARKDOWN)\n\n---\n\n${input.templateMarkdown.trim()}\n\n---\n\n`;
    prompt += `Instructions: Use this exemplar as a guide for structure and tone. Do not copy verbatim.\n\n`;
  }
  return prompt;
}

function resolveTailoringContext(input: GenerateCvInput) {
  const hasJob = isValidJobDescription(input.jobDescription);
  const hasSummary = isValidMatchingSummary(input.matchingSummary);

  if (hasJob && hasSummary) {
    return {
      jobDescription: input.jobDescription ?? null,
      matchingSummary: input.matchingSummary ?? null,
      company: input.company ?? null,
    };
  }

  if (input.jobDescription || input.matchingSummary) {
    console.warn('[generateCv] Invalid tailoring context detected. Falling back to generic.');
  }

  return null;
}

function isValidJobDescription(value?: JobDescription | null): value is JobDescription {
  return Boolean(value?.title);
}

function isValidMatchingSummary(
  value?: MatchingSummaryContext | null
): value is MatchingSummaryContext {
  if (!value) return false;
  return (
    typeof value.overallScore === 'number' &&
    typeof value.scoreBreakdown?.skillFit === 'number' &&
    typeof value.scoreBreakdown?.experienceFit === 'number' &&
    typeof value.scoreBreakdown?.interestFit === 'number' &&
    typeof value.scoreBreakdown?.edge === 'number'
  );
}

/**
 * Strip trailing notes/disclaimers that AI sometimes adds despite instructions
 * Pattern: --- followed by "note:" or "notes:"
 */
function stripTrailingNotes(cvText: string): string {
  // Match separator line followed by note/notes (case insensitive)
  const notePattern = /\n---+\s*\n.*?\b(note|notes)\b:?.*/is;
  const match = cvText.match(notePattern);

  if (match) {
    // Remove everything from the separator onwards
    const cleanedText = cvText.substring(0, match.index);
    console.log('[generateCv] Stripped trailing notes from AI response');
    return cleanedText.trim();
  }

  return cvText;
}

/**
 * Remove Markdown code fences (```markdown ... ```) if present
 */
function stripCodeFences(cvText: string): string {
  const trimmed = cvText.trim();
  const fencePattern = /^```[a-zA-Z0-9-]*\s*[\r\n]+([\s\S]*?)\s*```$/;
  const match = trimmed.match(fencePattern);
  if (match) {
    return match[1].trimEnd();
  }

  const withoutLeadingFence = trimmed.replace(/^```[a-zA-Z0-9-]*\s*[\r\n]*/, '');
  const withoutTrailingFence = withoutLeadingFence.replace(/[\r\n]*```$/, '');
  return withoutTrailingFence;
}

/**
 * Prepare input for logging (truncate long strings)
 */
function prepareInputForLogging(input: GenerateCvInput) {
  const LOG_TRUNCATE_LENGTH = 100;

  return {
    profile: input.profile,
    experienceCount: input.experiences?.length || 0,
    storyCount: input.stories?.length || 0,
    skillCount: input.profile.skills?.length || 0,
    hasPersonalCanvas: Boolean(input.personalCanvas),
    hasJobDescription: !!input.jobDescription,
    hasMatchingSummary: !!input.matchingSummary,
    jobDescriptionPreview: input.jobDescription
      ? truncateForLog(JSON.stringify(input.jobDescription), LOG_TRUNCATE_LENGTH)
      : null,
  };
}

/**
 * Lambda handler for generateCv operation
 */
export const handler = async (event: { arguments: GenerateCvInput }): Promise<string> => {
  return withAiOperationHandlerObject(
    'generateCv',
    event,
    async (args) => {
      const userPrompt = buildUserPrompt(args);
      const responseText = await invokeBedrock({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        operationName: 'generateCv',
      });
      console.log('[generateCv] Generated CV length:', responseText.length);

      // Strip any trailing notes the AI might have added
      const cleanedText = stripCodeFences(stripTrailingNotes(responseText));

      return cleanedText.trim();
    },
    prepareInputForLogging
  );
};
