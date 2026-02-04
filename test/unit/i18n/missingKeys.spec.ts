import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import enLocale from '../../../i18n/locales/en.json';

/**
 * Extracts actual i18n keys from source code by scanning for t('...')
 * This test ensures that all i18n keys used in components/pages are defined in the locale files
 */

let usedKeysFromCode: Set<string>;

/**
 * Recursively scans directory for Vue and TypeScript files
 */
function getAllFilesInDir(dir: string, ext: string[]): string[] {
  let files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules, .nuxt, dist, coverage
      if (['node_modules', '.nuxt', 'dist', 'coverage', '.git'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(getAllFilesInDir(fullPath, ext));
      } else if (ext.some((e) => entry.name.endsWith(e))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip directories we can't read
    console.log(e);
  }

  return files;
}

/**
 * Extracts i18n keys from source code by finding t('key') patterns
 */
function extractKeysFromCode(files: string[]): Set<string> {
  const keys = new Set<string>();
  // Match patterns like t('key.path') or t("key.path")
  // Must start with lowercase letter and contain at least one dot (i18n convention)
  const keyRegex = /t\(['"`]([a-z][a-zA-Z0-9._-]*\.[a-zA-Z0-9._-]+)['"`]\)/g;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      let match;

      while ((match = keyRegex.exec(content)) !== null) {
        const key = match[1];
        // Filter out common false positives
        if (!['v.', '$t.', 'i18n.'].some((prefix) => key.startsWith(prefix))) {
          keys.add(key);
        }
      }
    } catch (e) {
      // Skip files we can't read
      console.log(e);
    }
  }

  return keys;
}
beforeAll(() => {
  // Extract keys from actual source code
  const srcFiles = getAllFilesInDir(path.resolve(__dirname, '../../../src'), [
    '.vue',
    '.ts',
    '.tsx',
    '.js',
  ]);
  usedKeysFromCode = extractKeysFromCode(srcFiles);
});
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

describe('i18n - Missing Keys Detection', () => {
  it('should extract keys from source code', () => {
    // Verify we actually found keys from source code
    expect(usedKeysFromCode.size).toBeGreaterThan(0);
    expect(usedKeysFromCode.size).toBeGreaterThan(50); // Should find at least 50 keys
  });

  it('should have all keys used in code defined in locale file', () => {
    const definedKeys = getAllDefinedKeys(enLocale);
    const missingKeys = Array.from(usedKeysFromCode)
      .filter((key) => !definedKeys.has(key))
      .sort();

    expect(missingKeys).toEqual([]);
  });
});
it('should report keys found in source code', () => {
  // Verify we found a reasonable number of keys
  const storyKeys = Array.from(usedKeysFromCode).filter((k) => k.startsWith('stories'));
  const jobKeys = Array.from(usedKeysFromCode).filter((k) => k.startsWith('jobs'));

  expect(usedKeysFromCode.size).toBeGreaterThan(100); // Should find at least 100 keys
  expect(storyKeys.length).toBeGreaterThan(5);
  expect(jobKeys.length).toBeGreaterThan(5);
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

    expect(problematicKeys, `Keys with empty values: ${problematicKeys.join(', ')}`).toHaveLength(
      0
    );
  });
});
