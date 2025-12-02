import { invokeAiWithRetry } from './utils/bedrock';
import { truncateForLog, withAiOperationHandler } from './utils/common';

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
- Return ONLY valid JSON with no markdown wrappers`;

// Output schema for retry
const OUTPUT_SCHEMA = `{
  "achievements": ["string"],
  "kpiSuggestions": ["string"]
}`;

// Input types
export interface GenerateAchievementsAndKpisInput {
  starStory: {
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

SITUATION: ${starStory.situation}

TASK: ${starStory.task}

ACTION: ${starStory.action}

RESULT: ${starStory.result}

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
}): Promise<string> => {
  return withAiOperationHandler(
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
