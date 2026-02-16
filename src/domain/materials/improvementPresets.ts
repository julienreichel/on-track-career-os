export const MATERIAL_IMPROVEMENT_OTHER_PRESET = '__other__';

export const MATERIAL_IMPROVEMENT_PRESET_OPTIONS = [
  { value: 'More professional', labelKey: 'materialImprovement.presets.items.moreProfessional.label' },
  { value: 'More human', labelKey: 'materialImprovement.presets.items.moreHuman.label' },
  { value: 'More confident', labelKey: 'materialImprovement.presets.items.moreConfident.label' },
  { value: 'More formal', labelKey: 'materialImprovement.presets.items.moreFormal.label' },
  { value: 'Less formal', labelKey: 'materialImprovement.presets.items.lessFormal.label' },
  { value: 'More results-focused', labelKey: 'materialImprovement.presets.items.moreResultsFocused.label' },
  { value: 'Highlight achievements', labelKey: 'materialImprovement.presets.items.highlightAchievements.label' },
  { value: 'Show clearer value', labelKey: 'materialImprovement.presets.items.showClearerValue.label' },
  { value: 'More concise', labelKey: 'materialImprovement.presets.items.moreConcise.label' },
  { value: 'Improve flow', labelKey: 'materialImprovement.presets.items.improveFlow.label' },
  { value: MATERIAL_IMPROVEMENT_OTHER_PRESET, labelKey: 'materialImprovement.presets.items.other.label' },
] as const;

export type MaterialImprovementPresetValue = (typeof MATERIAL_IMPROVEMENT_PRESET_OPTIONS)[number]['value'];
