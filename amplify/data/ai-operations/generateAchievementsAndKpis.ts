import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandlerObject } from './utils/common';

/**
 * AWS Lambda handler for ai.generateAchievementsAndKpis
 *
 * PURPOSE:
 * Generate achievements + KPI suggestions grounded in user stories.
 * Extract quantifiable and qualitative KPIs from STAR story results.
 *
 * CONTRACT:
 * - Never invent numbers not present in the story
 * - Use qualitative KPIs if quantitative data is missing
 * - Return ONLY structured JSON
 * - Use fallback strategies for missing/malformed fields
 *
 * @see docs/AI_Interaction_Contract.md - Operation 4
 */

// System prompt - constant as per AIC
const SYSTEM_PROMPT = `You generate achievements and KPIs strictly from the user's story.
Do not invent numbers. Use qualitative KPIs if necessary.
Return JSON only.

RULES:
- Extract only achievements and KPIs explicitly supported by the story
- Do not invent quantitative metrics not present in the text
- If no numbers are available, provide qualitative KPIs (e.g., "Improved team efficiency")
- Achievements should be clear, concise accomplishments
- KPI suggestions should be measurable indicators of success
- Return ONLY valid JSON with no markdown wrappers

KPI STRUCTURE REQUIREMENTS:
KPIs should follow this pattern: [Category Verb] + [What was measured]

Use these category verbs based on the type of impact:
- Increase/grow/improve - for MORE of a positive thing (e.g., "Increased revenue by 25%")
- Reduce/cut/lower - for LESS of a negative thing (e.g., "Reduced deployment time by 40%")
- Avoid/prevent - to STOP something bad happening (e.g., "Prevented 200+ critical bugs")
- Maintain/sustain - to KEEP performance steady (e.g., "Maintained 99.9% uptime")
- Deliver/build/create - for OUTPUT/production (e.g., "Delivered 5 major features")
- Optimize/streamline - for EFFICIENCY & refinement (e.g., "Optimized API response time by 50%")
- Enable/support/empower - for CAPABILITY building (e.g., "Enabled team to deploy 3x faster")
- Save/free up - for TIME/money/resources (e.g., "Saved $100K annually")

Examples:
- "Increased user engagement by 40%"
- "Reduced customer churn from 15% to 8%"
- "Delivered 12 high-priority features on schedule"
- "Optimized database queries, improving response time by 60%"
- "Enabled cross-functional collaboration across 5 teams"`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "achievements": ["string"],
  "kpiSuggestions": ["string"]
}`;

// Input types
export interface GenerateAchievementsAndKpisInput {
  starStory: {
    title?: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

// Output types
export interface GenerateAchievementsAndKpisOutput {
  achievements: string[];
  kpiSuggestions: string[];
}

/**
 * Build user prompt with STAR story data
 */
function buildUserPrompt(starStory: GenerateAchievementsAndKpisInput['starStory']): string {
  return `Generate achievements and KPIs based on this STAR story:

TITLE: 
${starStory.title ?? 'Untitled STAR story'}

SITUATION: 
${starStory.situation}

TASK: 
${starStory.task}

ACTION: 
${starStory.action}

RESULT: 
${starStory.result}

OUTPUT_SCHEMA:
${OUTPUT_SCHEMA}`;
}

/**
 * Validate and clean AI output
 * Apply fallbacks for missing or invalid fields
 */
function validateOutput(output: unknown): GenerateAchievementsAndKpisOutput {
  if (!output || typeof output !== 'object') {
    throw new Error('Output must be an object');
  }

  const outputObj = output as Record<string, unknown>;

  // Apply fallbacks for missing or invalid fields
  const achievements = Array.isArray(outputObj.achievements)
    ? outputObj.achievements.filter((a: unknown) => typeof a === 'string' && a.trim().length > 0)
    : [];

  const kpiSuggestions = Array.isArray(outputObj.kpiSuggestions)
    ? outputObj.kpiSuggestions.filter((k: unknown) => typeof k === 'string' && k.trim().length > 0)
    : Array.isArray(outputObj.kpi_suggestions)
      ? outputObj.kpi_suggestions.filter(
          (k: unknown) => typeof k === 'string' && k.trim().length > 0
        )
      : [];

  // If both arrays are empty, provide fallback based on story
  if (achievements.length === 0 && kpiSuggestions.length === 0) {
    return {
      achievements: ['Successfully completed project'],
      kpiSuggestions: ['Project completion rate', 'Team collaboration effectiveness'],
    };
  }

  // If only achievements is empty, provide fallback
  if (achievements.length === 0) {
    achievements.push('Successfully completed project');
  }

  // If only kpiSuggestions is empty, provide fallback
  if (kpiSuggestions.length === 0) {
    kpiSuggestions.push('Project success metrics', 'Performance improvement indicators');
  }

  return {
    achievements: achievements as string[],
    kpiSuggestions: kpiSuggestions as string[],
  };
}

/**
 * Main Lambda handler
 */
export const handler = async (event: {
  arguments: GenerateAchievementsAndKpisInput;
}): Promise<GenerateAchievementsAndKpisOutput> => {
  return withAiOperationHandlerObject(
    'generateAchievementsAndKpis',
    event,
    async (args: GenerateAchievementsAndKpisInput) => {
      const userPrompt = buildUserPrompt(args.starStory);
      return invokeAiWithRetry<GenerateAchievementsAndKpisOutput>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        outputSchema: OUTPUT_SCHEMA,
        validate: validateOutput,
      });
    },
    (args: GenerateAchievementsAndKpisInput) => ({
      starStory: truncateForLog(JSON.stringify(args.starStory)),
    })
  );
};
