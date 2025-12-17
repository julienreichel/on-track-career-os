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
  experienceType?: 'work' | 'education' | 'volunteer' | 'project';
  responsibilities?: string[];
  tasks?: string[];
}

interface Story {
  id?: string;
  experienceId?: string;
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
2. SYNTHESIZE and CONDENSE: Transform verbose input into concise, impactful statements
3. Use proper Markdown syntax (# for headers, ** for bold, - for lists, etc.)
4. Follow CV best practices:
   - Start with contact info and professional summary (2-3 lines max)
   - Use action verbs and quantifiable achievements
   - Keep bullet points concise (1 line max, 2 lines only for major achievements)
   - Prioritize relevant experience for the role
   - Use reverse chronological order
5. When a job description is provided, tailor the CV to highlight relevant skills and experiences
6. Structure sections logically: Summary → Work Experience → Education → Skills → Additional sections

SYNTHESIS GUIDELINES:
- Combine similar responsibilities/tasks into single, powerful bullet points
- Extract KEY achievements from STAR stories - use metrics when available
- For skills: group by category (Technical, Languages, Soft Skills) and list only relevant ones
- For interests: select 3-5 professional/relevant interests only
- Eliminate redundancy and generic statements
- Each bullet point must demonstrate impact or value

FORMATTING GUIDELINES:
- Use # for name/header
- Use ## for section headers (Work Experience, Education, Skills, etc.)
- Use ### for job titles/institutions  
- Use **bold** for company names, institutions, and key metrics
- Use - for bullet points (3-5 per position max)
- Include dates in format: Month Year - Month Year (or Present)
- Keep total length appropriate (2 pages worth of content)
- Separate Education from Work Experience - do NOT mix them

EDUCATION HANDLING:
- Create separate "## Education" section for all education experiences
- Format: ### Degree/Certification at **Institution**
- Include relevant coursework, honors, or achievements only if notable

OUTPUT FORMAT:
Output ONLY pure Markdown text - no JSON, no code blocks, no wrapping.
Start directly with the CV content.
DO NOT add notes, disclaimers, or comments at the end of the CV.`;

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
 * Format a single experience with its related stories
 */
function formatSingleExperience(exp: Experience, stories: Story[] | undefined): string {
  let output = `\n### ${exp.title || 'Position'}\n`;
  const companyName = exp.company || exp.companyName;
  if (companyName) output += `**${companyName}**\n`;
  if (exp.startDate) {
    const endDate = exp.endDate || (exp.isCurrent ? 'Present' : 'Not specified');
    output += `${exp.startDate} - ${endDate}\n`;
  }

  // Add responsibilities
  if (exp.responsibilities?.length) {
    output += `\nResponsibilities:\n${exp.responsibilities.map((r) => `- ${r}`).join('\n')}\n`;
  }

  // Add tasks
  if (exp.tasks?.length) {
    output += `\nKey Tasks:\n${exp.tasks.map((t) => `- ${t}`).join('\n')}\n`;
  }

  // Add related stories
  const relatedStories = stories?.filter((s) => s.experienceId === exp.id) || [];
  if (relatedStories.length > 0) {
    output += `\nKey Achievements (from STAR stories):\n`;
    relatedStories.forEach((story) => {
      output += `- **Situation:** ${story.situation}\n`;
      output += `  **Task:** ${story.task}\n`;
      output += `  **Action:** ${story.action}\n`;
      output += `  **Result:** ${story.result}\n`;
      if (story.achievements?.length) {
        output += `  **Highlights:** ${story.achievements.join('; ')}\n`;
      }
    });
  }

  return output;
}

/**
 * Sort experiences by start date (most recent first)
 */
function sortExperiencesByDate(experiences: Experience[]): Experience[] {
  return [...experiences].sort((a, b) => {
    const dateA = a.startDate || '';
    const dateB = b.startDate || '';
    // Sort descending (most recent first)
    return dateB.localeCompare(dateA);
  });
}

/**
 * Format experiences section - grouped by type with related stories
 */
function formatExperiencesWithStories(
  experiences: Experience[],
  stories: Story[] | undefined
): string {
  if (experiences.length === 0) return '';

  // Group experiences by type
  const workExperiences = experiences.filter(
    (exp) => !exp.experienceType || exp.experienceType === 'work'
  );
  const educationExperiences = experiences.filter((exp) => exp.experienceType === 'education');
  const volunteerExperiences = experiences.filter((exp) => exp.experienceType === 'volunteer');
  const projectExperiences = experiences.filter((exp) => exp.experienceType === 'project');

  let output = '';

  // Format work experiences (sorted by most recent first)
  if (workExperiences.length > 0) {
    output += `## WORK EXPERIENCE\n`;
    sortExperiencesByDate(workExperiences).forEach((exp) => {
      output += formatSingleExperience(exp, stories);
    });
    output += '\n';
  }

  // Format education (sorted by most recent first)
  if (educationExperiences.length > 0) {
    output += `## EDUCATION\n`;
    sortExperiencesByDate(educationExperiences).forEach((exp) => {
      output += formatSingleExperience(exp, stories);
    });
    output += '\n';
  }

  // Format volunteer work (sorted by most recent first)
  if (volunteerExperiences.length > 0) {
    output += `## VOLUNTEER EXPERIENCE\n`;
    sortExperiencesByDate(volunteerExperiences).forEach((exp) => {
      output += formatSingleExperience(exp, stories);
    });
    output += '\n';
  }

  // Format projects (sorted by most recent first)
  if (projectExperiences.length > 0) {
    output += `## PROJECTS\n`;
    sortExperiencesByDate(projectExperiences).forEach((exp) => {
      output += formatSingleExperience(exp, stories);
    });
    output += '\n';
  }

  return output;
}

/**
 * Build the user prompt for CV generation
 */
function buildUserPrompt(input: GenerateCvInput): string {
  let prompt = 'Generate a professional, CONCISE CV in Markdown format.\n\n';
  prompt += 'SYNTHESIS INSTRUCTIONS:\n';
  prompt += '- CONDENSE verbose descriptions into impactful 1-line bullets\n';
  prompt += '- EXTRACT key metrics and achievements from STAR stories\n';
  prompt += '- ELIMINATE redundant or generic statements\n';
  prompt += '- SELECT only the most relevant skills/interests (not all)\n';
  prompt += '- COMBINE similar responsibilities into single points\n';
  prompt += '- Professional summary: 2-3 lines maximum\n\n';

  prompt += formatUserProfile(input.userProfile);
  prompt += formatExperiencesWithStories(input.selectedExperiences, input.stories);

  // Add skills with guidance
  if (input.skills?.length) {
    prompt += `## SKILLS (RAW LIST - SYNTHESIZE INTO CATEGORIES)\n`;
    prompt += `Available skills: ${input.skills.join(', ')}\n`;
    prompt += `Instructions: Organize into 2-4 categories (e.g., Technical, Languages, Soft Skills). Select only relevant skills.\n\n`;
  }

  // Add languages
  if (input.languages?.length) {
    prompt += `## LANGUAGES\n${input.languages.join(', ')}\n\n`;
  }

  // Add certifications
  if (input.certifications?.length) {
    prompt += `## CERTIFICATIONS\n${input.certifications.map((c) => `- ${c}`).join('\n')}\n\n`;
  }

  // Add interests with guidance
  if (input.interests?.length) {
    prompt += `## INTERESTS (RAW LIST - SELECT 3-5 MOST PROFESSIONAL)\n`;
    prompt += `Available interests: ${input.interests.join(', ')}\n`;
    prompt += `Instructions: Choose only 3-5 professional/relevant interests. Omit casual hobbies.\n\n`;
  }

  // Add job description for tailoring
  if (input.jobDescription) {
    prompt += `## TARGET JOB DESCRIPTION\n${input.jobDescription}\n\n`;
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
  prompt += `- Transform verbose input into professional, impactful output`;

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
