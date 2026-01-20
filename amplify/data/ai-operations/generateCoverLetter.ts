import { invokeBedrock } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';
import type {
  JobDescription,
  MatchingSummaryContext,
  CompanyProfile,
  PersonalCanvas,
  Experience,
  Profile,
  SpeechStory,
} from './types/schema-types';

const SYSTEM_PROMPT = `You generate professional, recruiter-grade cover letters.

GOAL
Write a one-page cover letter whose sole purpose is to increase the likelihood of an interview by clearly connecting the candidate’s evidence to the employer’s challenges.

OUTPUT FORMAT
- Markdown ONLY
- No JSON
- No explanations, no comments, no metadata

LETTER FORMAT (MANDATORY)
The output MUST be a real letter and include, in this order:
1) Salutation line (e.g. "Dear Hiring Manager,")
2) Body paragraphs (VOUS → MOI → NOUS)
3) Closing line (e.g. "Sincerely," or "Kind regards,")
4) Signature with the candidate’s full name (from PROFILE)

If the recipient name is unknown, use: "Dear Hiring Manager,"
Do NOT use placeholders like [Name] or [Company].

STYLE
- Professional, authentic, first-person
- Concrete, specific, grounded in facts
- Short paragraphs (2–4 lines)
- No buzzwords, no jargon unless present in the job description
- No repetitive transitions (e.g. "Moreover", "Additionally")
- Target length: 250–400 words (strict)

TRUTHFULNESS
- Use ONLY information explicitly provided in the inputs
- Do NOT invent skills, roles, achievements, metrics, or education
- If information is missing, omit it rather than guessing

STRUCTURE (MANDATORY — VOUS / MOI / NOUS)

VOUS — EMPLOYER CONTEXT (LONGEST, DECISIVE)
- Identify 2-4 key employer challenges or priorities
- Base them on the job description and/or company context
- Interpret them in your own words (do NOT rephrase job-ad bullets)
- Explain why these challenges matter now

VOUS — STRICT RULES
- Do NOT mention the candidate, their experience, or their qualifications
- No first-person references ("I", "my", "me") in VOUS
- VOUS is strictly about the employer’s context, risks, and priorities

MOI — PROOF OF VALUE
- Use at most ONE primary example per paragraph
- Use 2-3 examples total
- Each example must include:
  • context
  • one main action
  • outcome
- Supporting actions may be mentioned but must be subordinate
- Avoid lists of tools, techniques, or initiatives

NOUS — FUTURE COLLABORATION
- Forward-looking only (no recap of past achievements)
- Describe how collaboration would work in this specific context
- Must explicitly reference at least TWO of:
  • company size
  • product type (e.g. AI-powered SaaS)
  • growth or scaling phase
  • team structure or constraints
- 2-4 sentences maximum
- Avoid generic best-practice statements

CLOSING
The closing must contain TWO distinct elements, in this order:

A connection-oriented sentence that invites dialogue or exchange
- Focus on discussing challenges, perspectives, or collaboration
- Use neutral, senior language (curiosity, alignment, exchange)
- Do NOT express excitement or emotion

A professional sign-off line
- No pushiness, no exaggeration

Do NOT use generic enthusiasm phrases such as:
  "I am excited about", "thrilled", "passionate about your mission"

AVOID (HARD RULES)
- Generic openings ("I am writing to apply…")
- Overconfidence ("perfect fit", "you won't regret")
- Negative framing (burnout, unemployment, failure)
- Mission hype without direct relevance

SELF-CHECK (SILENT)
Before finalizing:
- VOUS contains no first-person references
- MOI contains no lists
- NOUS is context-anchored
- Closing contains no generic enthusiasm
If any rule is violated, rewrite before output.
`;

const PROMPT_INDENT_SPACES = 2;

export interface GenerateCoverLetterInput {
  language: 'en';
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  personalCanvas?: PersonalCanvas;
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
}

function buildUserPrompt(args: GenerateCoverLetterInput): string {
  const tailoring = resolveTailoringContext(args);
  const jobDescription = tailoring?.jobDescription ?? null;
  const matchingSummary = tailoring?.matchingSummary ?? null;
  const company = tailoring?.company ?? null;

  return `TASK
Using the information below, write a personalized cover letter following strictly the VOUS → MOI → NOUS structure and all system instructions.

LANGUAGE
${args.language}

PROFILE
${JSON.stringify(args.profile, null, PROMPT_INDENT_SPACES)}

EXPERIENCES
${JSON.stringify(args.experiences, null, PROMPT_INDENT_SPACES)}

STORIES
${JSON.stringify(args.stories ?? {}, null, PROMPT_INDENT_SPACES)}

PERSONAL CANVAS
${JSON.stringify(args.personalCanvas ?? {}, null, PROMPT_INDENT_SPACES)}

TARGET JOB DESCRIPTION (optional)
${JSON.stringify(jobDescription, null, PROMPT_INDENT_SPACES)}

MATCHING SUMMARY (optional)
${JSON.stringify(matchingSummary ?? {}, null, PROMPT_INDENT_SPACES)}

COMPANY SUMMARY (optional)
${JSON.stringify(company ?? {}, null, PROMPT_INDENT_SPACES)}

RECIPIENT CONTEXT
- Company name: ${company?.companyName || 'unknown'}
- Job title: ${jobDescription?.title || 'unknown'}

INTERNAL PLANNING (DO NOT OUTPUT)
Before writing:
1) Identify employer challenges (VOUS)
2) Select the strongest proof for each challenge (MOI)
3) Decide how collaboration would work in THIS context (NOUS)
Only then write the letter.

FORMATTING RULES
- Markdown only
- Natural letter flow (no section labels like "VOUS / MOI / NOUS")
- One salutation at the top
- One sign-off and signature at the end
- No generic opening sentence
`;
}

function resolveTailoringContext(args: GenerateCoverLetterInput) {
  const hasJob = isValidJobDescription(args.jobDescription);
  const hasSummary = isValidMatchingSummary(args.matchingSummary);

  if (hasJob && hasSummary) {
    return {
      jobDescription: args.jobDescription ?? null,
      matchingSummary: args.matchingSummary ?? null,
      company: args.company ?? null,
    };
  }

  if (args.jobDescription || args.matchingSummary) {
    console.warn(
      '[generateCoverLetter] Invalid tailoring context detected. Falling back to generic.'
    );
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

type HandlerEvent = {
  arguments: GenerateCoverLetterInput;
};

const PREAMBLE_PATTERNS = [
  /^here('?s| is) (your|a) cover letter[:\s-]*/i,
  /^certainly[,!]\s*/i,
  /^sure[,!]\s*/i,
  /^below is (your|a) cover letter[:\s-]*/i,
  /^cover letter[:\s-]*/i,
  /^---$/,
];

const EPILOGUE_PATTERNS = [
  /let me know if/i,
  /hope this helps/i,
  /if you'd like/i,
  /feel free to/i,
  /would you like/i,
  /happy to revise/i,
  /^---$/,
];

function stripCodeFences(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```[^\n]*\n?/g, ''))
    .replace(/```/g, '');
}

function stripPreamble(lines: string[]): string[] {
  let startIndex = 0;
  while (startIndex < lines.length) {
    const line = lines[startIndex]?.trim();
    if (!line) {
      startIndex += 1;
      continue;
    }
    if (PREAMBLE_PATTERNS.some((pattern) => pattern.test(line))) {
      startIndex += 1;
      continue;
    }
    break;
  }
  return lines.slice(startIndex);
}

function stripEpilogue(lines: string[]): string[] {
  let endIndex = lines.length;
  while (endIndex > 0) {
    const line = lines[endIndex - 1]?.trim();
    if (!line) {
      endIndex -= 1;
      continue;
    }
    if (EPILOGUE_PATTERNS.some((pattern) => pattern.test(line))) {
      endIndex -= 1;
      continue;
    }
    break;
  }
  return lines.slice(0, endIndex);
}

function cleanCoverLetterMarkdown(input: string): string {
  const normalized = stripCodeFences(input).trim();
  const lines = normalized.split(/\r?\n/);
  const withoutPreamble = stripPreamble(lines);
  const withoutEpilogue = stripEpilogue(withoutPreamble);
  return withoutEpilogue.join('\n').trim();
}

function parseCoverLetterResponse(responseText: string): { content: string } {
  return { content: responseText.trim() };
}

export const handler = async (event: HandlerEvent): Promise<string> => {
  if (!event?.arguments) {
    throw new Error('arguments are required');
  }

  return withAiOperationHandlerObject(
    'generateCoverLetter',
    { arguments: event.arguments },
    async (args) => {
      const userPrompt = buildUserPrompt(args);
      const responseText = await invokeBedrock(SYSTEM_PROMPT, userPrompt);

      console.log('[generateCoverLetter] Generated cover letter length:', responseText.length);

      const parsed = parseCoverLetterResponse(responseText);
      return cleanCoverLetterMarkdown(parsed.content);
    },
    (args) => ({
      userName: args.profile?.fullName,
      experienceCount: args.experiences?.length ?? 0,
      storyCount: args.stories?.length ?? 0,
      hasJobDescription: Boolean(args.jobDescription),
      hasMatchingSummary: Boolean(args.matchingSummary),
      profilePreview: truncateForLog(JSON.stringify(args.profile ?? {})),
    })
  );
};
