/**
 * Domain model for AI-generated Personal Canvas
 *
 * Represents the output of ai.generatePersonalCanvas operation
 * which generates all sections of the Personal Business Model Canvas
 * based on user profile, experiences, and STAR stories.
 *
 * @see docs/AI_Interaction_Contract.md - Operation 5
 */

/**
 * PersonalCanvas domain model
 *
 * Contains all 9 sections of the Personal Business Model Canvas:
 * 1. Value Proposition - What unique value you bring
 * 2. Key Activities - Core activities you perform
 * 3. Strengths/Advantage - Your competitive advantages
 * 4. Target Roles - Roles you're suited for
 * 5. Channels - How you reach employers/opportunities
 * 6. Resources - Your skills, experience, network
 * 7. Career Direction - Where you're heading
 * 8. Pain Relievers - Problems you solve
 * 9. Gain Creators - Value you create
 */
export interface PersonalCanvas {
  /** What unique value you bring to organizations */
  valueProposition: string[];

  /** Core professional activities and responsibilities */
  keyActivities: string[];

  /** Your competitive advantages and unique strengths */
  strengthsAdvantage: string[];

  /** Target job roles that align with your profile */
  targetRoles: string[];

  /** Channels for reaching employers and opportunities */
  channels: string[];

  /** Your skills, experience, certifications, and network */
  resources: string[];

  /** Your career direction and aspirations */
  careerDirection: string[];

  /** Problems you solve for organizations */
  painRelievers: string[];

  /** Value and outcomes you create */
  gainCreators: string[];
}

/**
 * Input for generating Personal Canvas
 */
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

/**
 * Validates that an object is a valid PersonalCanvas
 */
export function isPersonalCanvas(obj: unknown): obj is PersonalCanvas {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const typed = obj as Record<string, unknown>;

  const requiredArrayFields: (keyof PersonalCanvas)[] = [
    'valueProposition',
    'keyActivities',
    'strengthsAdvantage',
    'targetRoles',
    'channels',
    'resources',
    'careerDirection',
    'painRelievers',
    'gainCreators',
  ];

  return requiredArrayFields.every(
    (field) => Array.isArray(typed[field]) && typed[field].every((item: unknown) => typeof item === 'string')
  );
}
