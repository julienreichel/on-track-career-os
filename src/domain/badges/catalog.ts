import type { BadgeDefinition, BadgeId } from './types';

export const badgeCatalog: BadgeDefinition[] = [
  // Phase 1: Activation
  {
    id: 'grounded',
    titleKey: 'badges.catalog.grounded.title',
    descriptionKey: 'badges.catalog.grounded.description',
    icon: 'i-heroicons-check-badge',
    phase: 'phase1',
  },
  // Phase 2A: Job Understanding
  {
    id: 'jobClarity',
    titleKey: 'badges.catalog.jobClarity.title',
    descriptionKey: 'badges.catalog.jobClarity.description',
    icon: 'i-heroicons-light-bulb',
    phase: 'phase2',
  },
  // Phase 2B: Identity Building
  {
    id: 'identityDefined',
    titleKey: 'badges.catalog.identityDefined.title',
    descriptionKey: 'badges.catalog.identityDefined.description',
    icon: 'i-heroicons-user-circle',
    phase: 'phase2',
  },
  // Phase 3: Application Complete
  {
    id: 'applicationComplete',
    titleKey: 'badges.catalog.applicationComplete.title',
    descriptionKey: 'badges.catalog.applicationComplete.description',
    icon: 'i-heroicons-clipboard-document-check',
    phase: 'phase3',
  },
  // Bonus: Beyond the CV
  {
    id: 'beyondTheCv',
    titleKey: 'badges.catalog.beyondTheCv.title',
    descriptionKey: 'badges.catalog.beyondTheCv.description',
    icon: 'i-heroicons-sparkles',
    phase: 'bonus',
  },
  // Bonus: Company Strategist
  {
    id: 'companyStrategist',
    titleKey: 'badges.catalog.companyStrategist.title',
    descriptionKey: 'badges.catalog.companyStrategist.description',
    icon: 'i-heroicons-building-office',
    phase: 'bonus',
  },
  // Bonus: Custom Approach
  {
    id: 'customApproach',
    titleKey: 'badges.catalog.customApproach.title',
    descriptionKey: 'badges.catalog.customApproach.description',
    icon: 'i-heroicons-pencil-square',
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
