import { describe, it, expect } from 'vitest';
import enLocale from '../../../i18n/locales/en.json';

/**
 * Recursively collect all translation keys used in the codebase
 * This test ensures that all i18n keys used in components/pages are defined in the locale files
 */

const MISSING_KEYS: string[] = [];
const USED_KEYS = new Set<string>();

/**
 * Extracts all i18n keys from the locale file
 */
function getAllDefinedKeys(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();

  if (obj === null || obj === undefined) {
    return keys;
  }

  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively get nested keys
      const nestedKeys = getAllDefinedKeys(obj[key], fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    } else {
      // Only add leaf nodes (actual translation values)
      keys.add(fullKey);
    }
  });

  return keys;
}

/**
 * List of known i18n keys used in the codebase.
 * This list is manually maintained and should be updated when new keys are used.
 */
const KNOWN_USED_KEYS = [
  // Navigation
  'navigation.backToHome',
  'navigation.profile',
  'navigation.jobs',
  'navigation.applications',
  'navigation.companies',

  // Stories
  'stories.list.title',
  'stories.list.addNew',
  'stories.list.empty',
  'stories.form.fields.title.label',
  'stories.form.fields.situation.label',
  'stories.form.fields.task.label',
  'stories.form.fields.action.label',
  'stories.form.fields.result.label',
  'stories.form.fields.achievements.label',
  'stories.form.fields.kpis.list',
  'stories.form.generateAchievements',
  'stories.form.mode.chooseTitle',
  'stories.form.mode.chooseDescription',
  'stories.form.mode.interview.title',
  'stories.form.mode.interview.description',
  'stories.form.mode.manual.title',
  'stories.form.mode.manual.description',
  'stories.form.mode.freetext.title',
  'stories.form.mode.freetext.instructions',
  'stories.form.mode.freetext.label',
  'stories.form.mode.freetext.placeholder',

  // Jobs
  'jobs.form.createTitle',
  'jobs.form.createDescription',
  'jobs.form.errors.generic',
  'jobs.list.errors.generic',

  // Applications
  'applicationsPage.title',
  'applicationsPage.description',
  'applications.cvs.page.title',
  'applications.cvs.page.description',
  'applications.cvs.list.title',
  'coverLetters.page.title',
  'coverLetters.page.description',
  'speeches.page.title',
  'speeches.page.description',

  // Matching
  'matching.summaryCard.overallScore',
  'matching.summaryCard.recommendation.maybe',
  'matching.summaryCard.recommendation.apply',
  'matching.summaryCard.recommendation.skip',

  // Common
  'common.save',
  'common.cancel',
  'common.delete',
  'common.loading',
];

describe('i18n - Missing Keys Detection', () => {
  it('should have all required story form mode keys defined', () => {
    const definedKeys = getAllDefinedKeys(enLocale);

    const requiredKeys = [
      'stories.form.mode.chooseTitle',
      'stories.form.mode.chooseDescription',
      'stories.form.mode.interview.title',
      'stories.form.mode.interview.description',
      'stories.form.mode.manual.title',
      'stories.form.mode.manual.description',
      'stories.form.mode.freetext.title',
      'stories.form.mode.freetext.instructions',
      'stories.form.mode.freetext.label',
      'stories.form.mode.freetext.placeholder',
    ];

    const missingKeys = requiredKeys.filter((key) => !definedKeys.has(key));

    expect(missingKeys, `Missing i18n keys: ${missingKeys.join(', ')}`).toHaveLength(0);
  });

  it('should have all used keys defined in locale file', () => {
    const definedKeys = getAllDefinedKeys(enLocale);

    const missingKeys = KNOWN_USED_KEYS.filter((key) => !definedKeys.has(key));

    expect(missingKeys, `Missing i18n keys that are used in components: ${missingKeys.join(', ')}`).toHaveLength(0);
  });

  it('should report defined keys structure', () => {
    const definedKeys = getAllDefinedKeys(enLocale);

    // This is informational - it helps understand what keys are available
    const storyKeys = Array.from(definedKeys).filter((k) => k.startsWith('stories.form'));
    expect(storyKeys.length).toBeGreaterThan(10);
  });
});

describe('i18n - Locale File Validation', () => {
  it('should have valid JSON structure', () => {
    expect(enLocale).toBeDefined();
    expect(typeof enLocale).toBe('object');
  });

  it('should have key locale sections', () => {
    const requiredSections = ['stories', 'jobs', 'applications', 'matching'];

    requiredSections.forEach((section) => {
      expect(enLocale).toHaveProperty(section);
    });
  });

  it('should not have empty string values for important keys', () => {
    const definedKeys = getAllDefinedKeys(enLocale);
    const problematicKeys: string[] = [];

    definedKeys.forEach((key) => {
      const keys = key.split('.');
      let value: any = enLocale;

      for (const k of keys) {
        value = value?.[k];
      }

      if (typeof value === 'string' && value.trim() === '') {
        problematicKeys.push(`${key} (empty string)`);
      }
    });

    expect(problematicKeys, `Keys with empty values: ${problematicKeys.join(', ')}`).toHaveLength(0);
  });
});
