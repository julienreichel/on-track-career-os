import type { BadgeDefinition, BadgeId } from './types';

export const badgeCatalog: BadgeDefinition[] = [
  {
    id: 'grounded',
    titleKey: 'badges.catalog.grounded.title',
    descriptionKey: 'badges.catalog.grounded.description',
    icon: 'i-heroicons-globe-alt',
    phase: 'phase1',
  },
  {
    id: 'realityCheck',
    titleKey: 'badges.catalog.realityCheck.title',
    descriptionKey: 'badges.catalog.realityCheck.description',
    icon: 'i-heroicons-magnifying-glass',
    phase: 'phase2',
  },
  {
    id: 'selfAware',
    titleKey: 'badges.catalog.selfAware.title',
    descriptionKey: 'badges.catalog.selfAware.description',
    icon: 'i-heroicons-academic-cap',
    phase: 'phase2',
  },
  {
    id: 'cvTailored',
    titleKey: 'badges.catalog.cvTailored.title',
    descriptionKey: 'badges.catalog.cvTailored.description',
    icon: 'i-heroicons-document-check',
    phase: 'phase3',
  },
  {
    id: 'letterCrafted',
    titleKey: 'badges.catalog.letterCrafted.title',
    descriptionKey: 'badges.catalog.letterCrafted.description',
    icon: 'i-heroicons-envelope',
    phase: 'phase3',
  },
  {
    id: 'pitchReady',
    titleKey: 'badges.catalog.pitchReady.title',
    descriptionKey: 'badges.catalog.pitchReady.description',
    icon: 'i-heroicons-chat-bubble-left-right',
    phase: 'phase3',
  },
  {
    id: 'applicationReady',
    titleKey: 'badges.catalog.applicationReady.title',
    descriptionKey: 'badges.catalog.applicationReady.description',
    icon: 'i-heroicons-briefcase',
    phase: 'phase3',
  },
];

export const badgeCatalogById = badgeCatalog.reduce<Record<BadgeId, BadgeDefinition>>(
  (acc, badge) => {
    acc[badge.id] = badge;
    return acc;
  },
  {} as Record<BadgeId, BadgeDefinition>
);
