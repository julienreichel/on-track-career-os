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
Analyze the user's profile, experiences, and stories to generate all 9 official Business Model Canvas sections.
No invented skills. No fictional strengths. Only facts from the provided data.
Return ONLY valid JSON with no markdown wrappers.

OFFICIAL 9 BLOCKS WITH GUIDANCE:

1. CUSTOMER SEGMENTS (Who you help)
   - Which people do you create Value for?
   - Who is your most important Customer?
   - Who depends on your work in order to get their own jobs done?
   - Who are your actual "Customers"?

2. VALUE PROPOSITION (How you create value)
   - What Value do you deliver to Customers?
   - Which Customer problems are you helping to solve?
   - What Customer needs do you satisfy?
   - Describe specific benefits Customers derive from your work
   
3. CHANNELS (How they know you & how you deliver)
   - Through which Channels do your Customers want to be reached?
   - How are you reaching them now?
   - Which Channels work best?

4. CUSTOMER RELATIONSHIPS (How you interact)
   - What kind of relationships do your Customers expect you to establish and maintain?
   - Describe the types of relationships you have in place now

5. KEY ACTIVITIES (What you do)
   - List activities you perform at work each day that describe your occupation
   - Which activities does your Value Proposition require?
   - Which activities do your Channels and Customer Relationships require?
   
6. KEY RESOURCES (Who you are & what you have)
   - What do you need most at work to perform your Key Activities?
   - Do you rely on mental strength? Interpersonal skills? Physical strength? Experience?
   - What do you do particularly well (comes easily without effort)?
   - What are you known for? (Talents, Strengths, Skills)
   
7. KEY PARTNERS (Who helps you)
   - Who helps you provide Value to others?
   - Who helps you reach and work with your Customers?
   - Who supports you in what you do, why, and how?
   - Are there people who focus on part of your Key Activities on your behalf?

8. COST STRUCTURE (What you give)
   - What do you give to your work (time, energy, etc.)?
   - Which Key Activities cost you time or energy (professional or personal)?
   - Which Key Activities are most "expensive" (draining, stressful)?

9. REVENUE STREAMS (What you get)
   - For what Value are your Customers truly willing to pay?
   - For what do they pay you now?
   - How do they pay you now?
   - How might they prefer to pay?

RULES:
- Extract insights only from provided profile, experiences, and stories
- Do not infer skills or experiences not explicitly stated
- Ground all blocks in actual achievements and demonstrated experience
- Return ONLY valid JSON matching the specified schema`;

// Output schema for retry - Official Business Model Canvas 9 blocks
const OUTPUT_SCHEMA = `{
  "customerSegments": ["string"],
  "valueProposition": ["string"],
  "channels": ["string"],
  "customerRelationships": ["string"],
  "keyActivities": ["string"],
  "keyResources": ["string"],
  "keyPartners": ["string"],
  "costStructure": ["string"],
  "revenueStreams": ["string"]
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
  customerSegments: string[];
  valueProposition: string[];
  channels: string[];
  customerRelationships: string[];
  keyActivities: string[];
  keyResources: string[];
  keyPartners: string[];
  costStructure: string[];
  revenueStreams: string[];
}

/**
 * Validates and normalizes PersonalCanvas output
 * Supports both snake_case (AI response) and camelCase
 */
function validateAndNormalizeOutput(data: Record<string, unknown>): PersonalCanvasOutput {
  const normalized: PersonalCanvasOutput = {
    customerSegments: [],
    valueProposition: [],
    channels: [],
    customerRelationships: [],
    keyActivities: [],
    keyResources: [],
    keyPartners: [],
    costStructure: [],
    revenueStreams: [],
  };

  // Map snake_case to camelCase and normalize
  const fieldMappings: Record<string, keyof PersonalCanvasOutput> = {
    customer_segments: 'customerSegments',
    customerSegments: 'customerSegments',
    value_proposition: 'valueProposition',
    valueProposition: 'valueProposition',
    channels: 'channels',
    customer_relationships: 'customerRelationships',
    customerRelationships: 'customerRelationships',
    key_activities: 'keyActivities',
    keyActivities: 'keyActivities',
    key_resources: 'keyResources',
    keyResources: 'keyResources',
    key_partners: 'keyPartners',
    keyPartners: 'keyPartners',
    cost_structure: 'costStructure',
    costStructure: 'costStructure',
    revenue_streams: 'revenueStreams',
    revenueStreams: 'revenueStreams',
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
 * Uses guidance questions instead of invented answers
 */
function applyFallbacks(output: PersonalCanvasOutput): PersonalCanvasOutput {
  const result = { ...output };

  // Fallback for customer segments - use guidance questions
  if (result.customerSegments.length === 0) {
    result.customerSegments = [
      'Which people do you create Value for?',
      'Who is your most important Customer?',
      'Who depends on your work to get their own jobs done?',
    ];
  }

  // Fallback for value proposition - use guidance questions
  if (result.valueProposition.length === 0) {
    result.valueProposition = [
      'What Value do you deliver to Customers?',
      'Which Customer problems are you helping to solve?',
      'What Customer needs do you satisfy?',
    ];
  }

  // Fallback for channels - use guidance questions
  if (result.channels.length === 0) {
    result.channels = [
      'Through which Channels do your Customers want to be reached?',
      'How are you reaching them now?',
      'Which Channels work best?',
    ];
  }

  // Fallback for customer relationships - use guidance questions
  if (result.customerRelationships.length === 0) {
    result.customerRelationships = [
      'What kind of relationships do your Customers expect you to establish?',
      'Describe the types of relationships you have in place now',
    ];
  }

  // Fallback for key activities - use guidance questions
  if (result.keyActivities.length === 0) {
    result.keyActivities = [
      'List activities you perform at work each day',
      'Which activities does your Value Proposition require?',
      'Consider: Creating, Building, Selling, Supporting',
    ];
  }

  // Fallback for key resources - use guidance questions
  if (result.keyResources.length === 0) {
    result.keyResources = [
      'What do you need most at work to perform your Key Activities?',
      'What do you do particularly well?',
      'What are you known for? (Talents, Strengths, Skills)',
    ];
  }

  // Fallback for key partners - use guidance questions
  if (result.keyPartners.length === 0) {
    result.keyPartners = [
      'Who helps you provide Value to others?',
      'Who helps you reach and work with your Customers?',
      'Who supports you in what you do?',
    ];
  }

  // Fallback for cost structure - use guidance questions
  if (result.costStructure.length === 0) {
    result.costStructure = [
      'What do you give to your work (time, energy)?',
      'Which Key Activities cost you time or energy?',
      'Which activities are most expensive (draining, stressful)?',
    ];
  }

  // Fallback for revenue streams - use guidance questions
  if (result.revenueStreams.length === 0) {
    result.revenueStreams = [
      'For what Value are your Customers truly willing to pay?',
      'For what do they pay you now?',
      'How might they prefer to pay?',
    ];
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
async function generatePersonalCanvasCore(
  input: PersonalCanvasInput
): Promise<PersonalCanvasOutput> {
  // Generate user prompt with injected data
  const profileSummary = `
Name: ${input.profile.fullName || 'N/A'}
Headline: ${input.profile.headline || 'N/A'}
Summary: ${input.profile.summary || 'N/A'}
  `.trim();

  const experiencesSummary = input.experiences
    .map((exp, idx) =>
      `
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
    .map((story, idx) =>
      `
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
