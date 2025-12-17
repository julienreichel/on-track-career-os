import { invokeBedrock } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AI Operation: generateCv
 *
 * Generates a complete CV in Markdown format based on user profile, experiences, and optional job description.
 * Follows CV best practices and tailors content when a job description is provided.
 *
 * Input Schema:
 * - userProfile: Object containing user's profile information (fullName, headline, location, goals, strengths)
 * - selectedExperiences: Array of experience objects to include
 * - stories: Optional array of STAR stories
 * - skills: Optional array of skills
 * - languages: Optional array of languages
 * - certifications: Optional array of certifications
 * - interests: Optional array of interests
 * - jobDescription: Optional job description for tailoring
 *
 * Output Schema:
 * - Returns complete CV as plain Markdown text
 */

interface UserProfile {
  fullName?: string;
  headline?: string;
  location?: string;
  seniorityLevel?: string;
  goals?: string[];
  strengths?: string[];
}

interface Experience {
  id?: string;
  title?: string;
  company?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string[];
  tasks?: string[];
}

interface Story {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  achievements?: string[];
}

interface GenerateCvInput {
  userProfile: UserProfile;
  selectedExperiences: Experience[];
  stories?: Story[];
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  interests?: string[];
  jobDescription?: string;
}

/**
 * System prompt for CV generation
 */
const SYSTEM_PROMPT = `You are an expert CV writer and career coach. Your task is to generate a professional, ATS-optimized CV in Markdown format.

CRITICAL REQUIREMENTS:
1. Output ONLY valid Markdown - no additional commentary
2. Use proper Markdown syntax (# for headers, ** for bold, - for lists, etc.)
3. Follow CV best practices:
   - Start with contact info and professional summary
   - Use action verbs and quantifiable achievements
   - Keep bullet points concise (1-2 lines max)
   - Prioritize relevant experience for the role
   - Use reverse chronological order
4. When a job description is provided, tailor the CV to highlight relevant skills and experiences
5. Structure sections logically: Summary → Experience → Education → Skills → Additional sections
6. Ensure proper spacing between sections for readability

FORMATTING GUIDELINES:
- Use # for name/header
- Use ## for section headers
- Use ### for job titles/institutions
- Use **bold** for emphasis on key achievements
- Use - for bullet points
- Include dates in format: Month Year - Month Year (or Present)
- Keep total length appropriate (1-2 pages worth of content)

OUTPUT FORMAT:
Output ONLY pure Markdown text - no JSON, no code blocks, no wrapping.
Start directly with the CV content.`;

/**
 * Format user profile section
 */
function formatUserProfile(profile: UserProfile): string {
  let section = `## USER PROFILE\n`;
  section += `Name: ${profile.fullName || 'Not provided'}\n`;
  if (profile.headline) section += `Professional Title: ${profile.headline}\n`;
  if (profile.location) section += `Location: ${profile.location}\n`;
  if (profile.seniorityLevel) section += `Seniority: ${profile.seniorityLevel}\n`;

  if (profile.goals && profile.goals.length > 0) {
    section += `\nCareer Goals:\n${profile.goals.map((g) => `- ${g}`).join('\n')}\n`;
  }
  if (profile.strengths && profile.strengths.length > 0) {
    section += `\nKey Strengths:\n${profile.strengths.map((s) => `- ${s}`).join('\n')}\n`;
  }
  return section + '\n';
}

/**
 * Format experiences section
 */
function formatExperiences(experiences: Experience[]): string {
  if (experiences.length === 0) return '';

  let section = `## WORK EXPERIENCE (${experiences.length} positions)\n`;
  experiences.forEach((exp, idx) => {
    section += `\n### Experience ${idx + 1}\n`;
    section += `Title: ${exp.title || 'Not provided'}\n`;
    const companyName = exp.company || exp.companyName;
    if (companyName) section += `Company: ${companyName}\n`;
    if (exp.startDate) {
      const endDate = exp.endDate || (exp.isCurrent ? 'Present' : 'Not specified');
      section += `Period: ${exp.startDate} - ${endDate}\n`;
    }
    if (exp.responsibilities?.length) {
      section += `Responsibilities:\n${exp.responsibilities.map((r) => `- ${r}`).join('\n')}\n`;
    }
    if (exp.tasks?.length) {
      section += `Key Tasks:\n${exp.tasks.map((t) => `- ${t}`).join('\n')}\n`;
    }
  });
  return section + '\n';
}

/**
 * Format STAR stories section
 */
function formatStories(stories: Story[] | undefined): string {
  if (!stories || stories.length === 0) return '';

  let section = `## ACHIEVEMENT STORIES (${stories.length} stories)\n`;
  stories.forEach((story, idx) => {
    section += `\n### Story ${idx + 1}\n`;
    if (story.situation) section += `Situation: ${story.situation}\n`;
    if (story.task) section += `Task: ${story.task}\n`;
    if (story.action) section += `Action: ${story.action}\n`;
    if (story.result) section += `Result: ${story.result}\n`;
    if (story.achievements?.length) {
      section += `Key Achievements:\n${story.achievements.map((a) => `- ${a}`).join('\n')}\n`;
    }
  });
  return section + '\n';
}

/**
 * Build the user prompt for CV generation
 */
function buildUserPrompt(input: GenerateCvInput): string {
  let prompt =
    'Generate a professional CV in Markdown format. YOU MUST USE THE EXACT DATA PROVIDED BELOW - do not invent or substitute information.\n\n';

  prompt += formatUserProfile(input.userProfile);
  prompt += formatExperiences(input.selectedExperiences);
  prompt += formatStories(input.stories);

  // Add skills
  if (input.skills?.length) {
    prompt += `## SKILLS\n${input.skills.join(', ')}\n\n`;
  }

  // Add languages
  if (input.languages?.length) {
    prompt += `## LANGUAGES\n${input.languages.join(', ')}\n\n`;
  }

  // Add certifications
  if (input.certifications?.length) {
    prompt += `## CERTIFICATIONS\n${input.certifications.map((c) => `- ${c}`).join('\n')}\n\n`;
  }

  // Add interests
  if (input.interests?.length) {
    prompt += `## INTERESTS\n${input.interests.join(', ')}\n\n`;
  }

  // Add job description for tailoring
  if (input.jobDescription) {
    prompt += `## TARGET JOB DESCRIPTION\n${input.jobDescription}\n\n`;
    prompt += `IMPORTANT: Tailor the CV to highlight experiences, skills, and achievements most relevant to this job description. Emphasize matching keywords and requirements.\n\n`;
  }

  prompt += `CRITICAL REMINDER: Use ONLY the information provided above. Do not use placeholder names like "John Doe" or invent any data. The CV MUST contain the exact names, titles, companies, and dates from the input data.`;

  return prompt;
}

/**
 * Prepare input for logging (truncate long strings)
 */
function prepareInputForLogging(input: GenerateCvInput) {
  const LOG_TRUNCATE_LENGTH = 100;

  return {
    userProfile: input.userProfile,
    experienceCount: input.selectedExperiences?.length || 0,
    storyCount: input.stories?.length || 0,
    skillCount: input.skills?.length || 0,
    hasJobDescription: !!input.jobDescription,
    jobDescriptionPreview: input.jobDescription
      ? truncateForLog(input.jobDescription, LOG_TRUNCATE_LENGTH)
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
      const responseText = await invokeBedrock(SYSTEM_PROMPT, userPrompt);
      console.log('[generateCv] Generated CV length:', responseText.length);
      return responseText.trim();
    },
    prepareInputForLogging
  );
};
