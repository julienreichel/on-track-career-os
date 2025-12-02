import { invokeAiWithRetry, type InvokeAiOptions } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AWS Lambda handler for ai.generatePersonalCanvas
 *
 * PURPOSE:
 * Generate all sections of the Personal Business Model Canvas from user profile,
 * experiences, and STAR stories.
 *
 * CONTRACT:
 * - No invented skills or fictional strengths
 * - Strictly derive insights from provided user data
 * - Return ONLY structured JSON
 * - Use fallback strategies for missing/malformed fields
 *
 * @see docs/AI_Interaction_Contract.md - Operation 5
 */

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You produce the Personal Business Model Canvas strictly from user data.
Analyze the user's profile, experiences, and stories to generate all 9 canvas sections.
No invented skills. No fictional strengths. Only facts from the provided data.
Return ONLY valid JSON with no markdown wrappers.

RULES:
- Extract insights only from provided profile, experiences, and stories
- Do not infer skills or experiences not explicitly stated
- Value proposition should be grounded in actual achievements and experiences
- Target roles should align with demonstrated experience
- Strengths should come from actual accomplishments in stories
- Return ONLY valid JSON matching the specified schema`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "valueProposition": ["string"],
  "keyActivities": ["string"],
  "strengthsAdvantage": ["string"],
  "targetRoles": ["string"],
  "channels": ["string"],
  "resources": ["string"],
  "careerDirection": ["string"],
  "painRelievers": ["string"],
  "gainCreators": ["string"]
}`;

// Type definitions matching AI Interaction Contract
export interface PersonalCanvasInput {
  profile: {
    fullName?: string;
    headline?: string;
    summary?: string;
  };
  experiences: Array<{
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    responsibilities?: string[];
    tasks?: string[];
  }>;
  stories: Array<{
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    achievements?: string[];
    kpiSuggestions?: string[];
  }>;
}

export interface PersonalCanvasOutput {
  valueProposition: string[];
  keyActivities: string[];
  strengthsAdvantage: string[];
  targetRoles: string[];
  channels: string[];
  resources: string[];
  careerDirection: string[];
  painRelievers: string[];
  gainCreators: string[];
}

/**
 * Validates and normalizes PersonalCanvas output
 * Supports both snake_case (AI response) and camelCase
 */
function validateAndNormalizeOutput(data: Record<string, unknown>): PersonalCanvasOutput {
  const normalized: PersonalCanvasOutput = {
    valueProposition: [],
    keyActivities: [],
    strengthsAdvantage: [],
    targetRoles: [],
    channels: [],
    resources: [],
    careerDirection: [],
    painRelievers: [],
    gainCreators: [],
  };

  // Map snake_case to camelCase and normalize
  const fieldMappings: Record<string, keyof PersonalCanvasOutput> = {
    value_proposition: 'valueProposition',
    valueProposition: 'valueProposition',
    key_activities: 'keyActivities',
    keyActivities: 'keyActivities',
    strengths_advantage: 'strengthsAdvantage',
    strengthsAdvantage: 'strengthsAdvantage',
    target_roles: 'targetRoles',
    targetRoles: 'targetRoles',
    channels: 'channels',
    resources: 'resources',
    career_direction: 'careerDirection',
    careerDirection: 'careerDirection',
    pain_relievers: 'painRelievers',
    painRelievers: 'painRelievers',
    gain_creators: 'gainCreators',
    gainCreators: 'gainCreators',
  };

  for (const [sourceKey, targetKey] of Object.entries(fieldMappings)) {
    if (Array.isArray(data[sourceKey])) {
      normalized[targetKey] = (data[sourceKey] as unknown[]).filter(
        (item: unknown) => typeof item === 'string' && item.trim() !== ''
      ) as string[];
    }
  }

  return normalized;
}

/**
 * Apply fallback strategies for missing/empty canvas sections
 */
function applyFallbacks(output: PersonalCanvasOutput): PersonalCanvasOutput {
  const result = { ...output };

  // Fallback for value proposition
  if (result.valueProposition.length === 0) {
    result.valueProposition = ['Experienced professional with diverse background'];
  }

  // Fallback for key activities
  if (result.keyActivities.length === 0) {
    result.keyActivities = ['Professional responsibilities and tasks'];
  }

  // Fallback for strengths advantage
  if (result.strengthsAdvantage.length === 0) {
    result.strengthsAdvantage = ['Professional experience and skills'];
  }

  // Fallback for target roles
  if (result.targetRoles.length === 0) {
    result.targetRoles = ['Roles aligned with experience'];
  }

  // Fallback for channels
  if (result.channels.length === 0) {
    result.channels = ['Professional networks', 'Job platforms'];
  }

  // Fallback for resources
  if (result.resources.length === 0) {
    result.resources = ['Skills', 'Experience', 'Network'];
  }

  // Fallback for career direction
  if (result.careerDirection.length === 0) {
    result.careerDirection = ['Continue professional growth'];
  }

  // Fallback for pain relievers
  if (result.painRelievers.length === 0) {
    result.painRelievers = ['Address organizational challenges'];
  }

  // Fallback for gain creators
  if (result.gainCreators.length === 0) {
    result.gainCreators = ['Drive value through expertise'];
  }

  return result;
}

// Constants for log truncation
const PROFILE_LOG_MAX_LENGTH = 200;

/**
 * Validates Personal Canvas output with fallbacks
 */
function validatePersonalCanvas(parsed: Partial<PersonalCanvasOutput>): PersonalCanvasOutput {
  const validated = validateAndNormalizeOutput(parsed as Record<string, unknown>);
  return applyFallbacks(validated);
}

/**
 * Core logic for generatePersonalCanvas operation
 */
async function generatePersonalCanvasCore(input: PersonalCanvasInput): Promise<PersonalCanvasOutput> {
  // Generate user prompt with injected data
  const profileSummary = `
Name: ${input.profile.fullName || 'N/A'}
Headline: ${input.profile.headline || 'N/A'}
Summary: ${input.profile.summary || 'N/A'}
  `.trim();

  const experiencesSummary = input.experiences
    .map(
      (exp, idx) => `
Experience ${idx + 1}:
- Title: ${exp.title || 'N/A'}
- Company: ${exp.company || 'N/A'}
- Duration: ${exp.startDate || 'N/A'} to ${exp.endDate || 'Present'}
- Responsibilities: ${exp.responsibilities?.join(', ') || 'N/A'}
- Tasks: ${exp.tasks?.join(', ') || 'N/A'}
    `.trim()
    )
    .join('\n\n');

  const storiesSummary = input.stories
    .map(
      (story, idx) => `
Story ${idx + 1}:
- Situation: ${story.situation || 'N/A'}
- Task: ${story.task || 'N/A'}
- Action: ${story.action || 'N/A'}
- Result: ${story.result || 'N/A'}
- Achievements: ${story.achievements?.join('; ') || 'N/A'}
- KPIs: ${story.kpiSuggestions?.join('; ') || 'N/A'}
    `.trim()
    )
    .join('\n\n');

  const userPrompt = `Generate the Personal Business Model Canvas from the following user data:

PROFILE:
${profileSummary}

EXPERIENCES:
${experiencesSummary || 'No experiences provided'}

STORIES:
${storiesSummary || 'No stories provided'}

Analyze this data and generate all 9 sections of the Personal Business Model Canvas.
Return ONLY valid JSON matching this schema:
${OUTPUT_SCHEMA}`;

  // Invoke AI with retry logic
  const aiOptions: InvokeAiOptions<PersonalCanvasOutput> = {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    outputSchema: OUTPUT_SCHEMA,
    validate: validatePersonalCanvas,
    operationName: 'generatePersonalCanvas',
  };

  const result = await invokeAiWithRetry(aiOptions);

  return result;
}

// Lambda event type
interface LambdaEvent {
  arguments: PersonalCanvasInput;
}

// Export handler wrapped with common error handling
export const handler = (event: LambdaEvent) =>
  withAiOperationHandlerObject(
    'generatePersonalCanvas',
    event,
    generatePersonalCanvasCore,
    (args) => ({
      profile: truncateForLog(JSON.stringify(args.profile), PROFILE_LOG_MAX_LENGTH),
      experiencesCount: args.experiences.length,
      storiesCount: args.stories.length,
    })
  );
