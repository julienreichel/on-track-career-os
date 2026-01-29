import type { BadgeDefinition, BadgeId } from './types';

export const badgeCatalog: BadgeDefinition[] = [
  // Phase 1: Activation
  {
    id: 'grounded',
    titleKey: 'badges.grounded.title',
    descriptionKey: 'badges.grounded.description',
    icon: 'i-heroicons-check-badge',
    phase: 'phase1',
  },
  // Phase 2A: Job Understanding
  {
    id: 'jobClarity',
    titleKey: 'badges.jobClarity.title',
    descriptionKey: 'badges.jobClarity.description',
    icon: 'i-heroicons-light-bulb',
    phase: 'phase2',
  },
  // Phase 2B: Identity Building
  {
    id: 'identityDefined',
    titleKey: 'badges.identityDefined.title',
    descriptionKey: 'badges.identityDefined.description',
    icon: 'i-heroicons-user-circle',
    phase: 'phase2',
  },
  // Phase 3: Application Complete
  {
    id: 'applicationComplete',
    titleKey: 'badges.applicationComplete.title',
    descriptionKey: 'badges.applicationComplete.description',
    icon: 'i-heroicons-clipboard-document-check',
    phase: 'phase3',
  },
  // Bonus: Beyond the CV
  {
    id: 'beyondTheCv',
    titleKey: 'badges.beyondTheCv.title',
    descriptionKey: 'badges.beyondTheCv.description',
    icon: 'i-heroicons-sparkles',
    phase: 'bonus',
  },
  // Bonus: Company Strategist
  {
    id: 'companyStrategist',
    titleKey: 'badges.companyStrategist.title',
    descriptionKey: 'badges.companyStrategist.description',
    icon: 'i-heroicons-building-office',
    phase: 'bonus',
  },
  // Bonus: Custom Approach
  {
    id: 'customApproach',
    titleKey: 'badges.customApproach.title',
    descriptionKey: 'badges.customApproach.description',
    icon: 'i-heroicons-pencil',
    phase: 'bonus',
  },
];

export const badgeCatalogById = badgeCatalog.reduce<Record<BadgeId, BadgeDefinition>>(
  (acc, badge) => {
    acc[badge.id] = badge;
    return acc;
  },
  {} as Record<BadgeId, BadgeDefinition>
);
