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
  primaryEmail?: string;
  primaryPhone?: string;
  workPermitInfo?: string;
  goals?: string[];
  strengths?: string[];
  socialLinks?: string[];
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
const SYSTEM_PROMPT = `You are an expert CV writer and career coach.
Your task is to generate a professional, ATS-optimized CV in Markdown format with high specificity, strong professional identity, and measurable achievements.

## CRITICAL REQUIREMENTS:
1. Output ONLY valid Markdown - no additional commentary
2. Do NOT include explanations, commentary, or labels.
3. Final CV must look like a real human-written CV, not raw database output.

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
   * Location | Contacts | Work authorization if provided | Raw social links if relevant
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
   * Company | Dates
   * 4-7 bullets MAX, For senior roles (5+ years), produce 6-7 bullets whenever data supports it.
   * Each bullet must show IMPACT (not duties)
4. **Education**
   * Clean, chronological.
5. **Skills**
   * Group skills into categories (Technical, Languages, Soft, Tools).
   * Remove irrelevant ones.
   * Skills section must reflect breadth; include 12-18 skills grouped into categories
6. **Certifications, Languages, Interests**
   * Only if meaningful.

## LANGUAGE GUIDELINES
Use strong verbs:
* Led
* Architected
* Built
* Launched
* Delivered
* Reduced
* Enabled
* Scaled
* Automated
* Designed

Avoid weak / generic verbs:
* Helped
* Participated
* Worked on
* Assisted

## REQUIRED BULLET STYLE RULES
* Single-line bullets only
* Maximum 6 bullets per job
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
 * Format user profile section
 */
function formatUserProfile(profile: UserProfile): string {
  let section = `## USER PROFILE\n`;
  section += `Name: ${profile.fullName || 'Not provided'}\n`;
  if (profile.headline) section += `Professional Title: ${profile.headline}\n`;
  if (profile.location) section += `Location: ${profile.location}\n`;
  if (profile.seniorityLevel) section += `Seniority: ${profile.seniorityLevel}\n`;
  if (profile.primaryEmail) section += `Email: ${profile.primaryEmail}\n`;
  if (profile.primaryPhone) section += `Phone: ${profile.primaryPhone}\n`;

  if (profile.goals && profile.goals.length > 0) {
    section += `\nCareer Goals:\n${profile.goals.map((g) => `- ${g}`).join('\n')}\n`;
  }
  if (profile.strengths && profile.strengths.length > 0) {
    section += `\nKey Strengths:\n${profile.strengths.map((s) => `- ${s}`).join('\n')}\n`;
  }
  if (profile.socialLinks && profile.socialLinks.length > 0) {
    section += `\nSocial Links:\n`;
    section += profile.socialLinks.map((link) => `- ${link}`).join('\n');
    section += '\n';
  }
  if (profile.workPermitInfo) {
    section += `\nWork Authorization:\n- ${profile.workPermitInfo}\n`;
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
  const fencePattern = /^```[a-zA-Z0-9-]*\s*\n([\s\S]*?)\n```$/;
  const match = cvText.match(fencePattern);
  if (match) {
    return match[1];
  }

  return cvText.replace(/^```[a-zA-Z0-9-]*\s*\n?/, '').replace(/\n```$/, '');
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

      // Strip any trailing notes the AI might have added
      const cleanedText = stripCodeFences(stripTrailingNotes(responseText));

      return cleanedText.trim();
    },
    prepareInputForLogging
  );
};
