import fs from 'fs';
import path from 'path';
import enLocale from './i18n/locales/en.json';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts all i18n keys from the locale file
 */
function getAllDefinedKeys(obj: unknown, prefix = ''): Set<string> {
  const keys = new Set<string>();

  if (obj === null || obj === undefined) {
    return keys;
  }

  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const nestedKeys = getAllDefinedKeys(obj[key], fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  });

  return keys;
}

/**
 * Recursively scans directory for Vue and TypeScript files
 */
function getAllFilesInDir(dir: string, ext: string[]): string[] {
  let files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (['node_modules', '.nuxt', 'dist', 'coverage', '.git', 'amplify'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(getAllFilesInDir(fullPath, ext));
      } else if (ext.some((e) => entry.name.endsWith(e))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip
    console.log(e);
  }

  return files;
}

/**
 * Extracts i18n keys from source code
 */
function extractKeysFromCode(files: string[]): Set<string> {
  const keys = new Set<string>();
  const keyRegex = /t\(['"`]([a-z][a-zA-Z0-9._-]*\.[a-zA-Z0-9._-]+)['"`]\)/g;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      let match;

      while ((match = keyRegex.exec(content)) !== null) {
        const key = match[1];
        if (!['v.', '$t.', 'i18n.'].some((prefix) => key.startsWith(prefix))) {
          keys.add(key);
        }
      }
    } catch (e) {
      // Skip
      console.log(e);
    }
  }

  return keys;
}

const srcFiles = getAllFilesInDir(path.resolve(__dirname, 'src'), ['.vue', '.ts', '.tsx', '.js']);
const usedKeys = extractKeysFromCode(srcFiles);
const definedKeys = getAllDefinedKeys(enLocale);

const missingKeys = Array.from(usedKeys)
  .filter((key) => !definedKeys.has(key))
  .sort();

console.log('\n📊 Missing i18n Keys:');
console.log(`Total used: ${usedKeys.size}`);
console.log(`Total defined: ${definedKeys.size}`);
console.log(`Missing: ${missingKeys.length}\n`);

if (missingKeys.length > 0) {
  console.log('Missing keys:');
  missingKeys.forEach((key) => {
    console.log(`  - ${key}`);
  });
} else {
  console.log('✅ All keys are defined!');
}
