export const MATERIAL_IMPROVEMENT_PRESETS = [
  'target-role-alignment',
  'quantified-impact',
  'clarity-and-conciseness',
  'ats-keyword-coverage',
  'stronger-openings',
  'tone-and-confidence',
] as const;

export type MaterialImprovementPreset = (typeof MATERIAL_IMPROVEMENT_PRESETS)[number];

export function isMaterialImprovementPreset(value: string): value is MaterialImprovementPreset {
  return MATERIAL_IMPROVEMENT_PRESETS.includes(value as MaterialImprovementPreset);
}
