#!/usr/bin/env node
/**
 * Nuxt + Amplify Gen2 Clean Architecture Scaffolder (ESM version)
 * ---------------------------------------------------------------
 * Generates:
 *   src/domain/<model>/<Model>.ts
 *   src/domain/<model>/<Model>Repository.ts
 *   src/domain/<model>/<Model>Service.ts
 *   src/application/<model>/use<Model>.ts
 *
 * Usage:
 *   npx gen-model UserProfile
 */

import fs from 'fs';
import path from 'path';

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
function pascalCase(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function kebabCase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filepath, content) {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`✔ Created ${filepath}`);
}

// ----------------------------------------------------------
// TEMPLATE: Domain Model
// ----------------------------------------------------------
function templateModel(modelName) {
  return `import type { Schema } from '@amplify/data/resource';

export type ${modelName} = Schema['${modelName}']['type'];
export type ${modelName}CreateInput = Schema['${modelName}']['createType'];
export type ${modelName}UpdateInput = Schema['${modelName}']['updateType'];

`;
}

// ----------------------------------------------------------
// TEMPLATE: Repository (Nuxt + Amplify + gqlOptions)
// ----------------------------------------------------------
function templateRepository(modelName) {
  return `import { gqlOptions } from '@/data/graphql/options'
import type { ${modelName}CreateInput, ${modelName}UpdateInput } from './${modelName}';

export class ${modelName}Repository {
  private get model() {
    return useNuxtApp().$Amplify.GraphQL.client.models.${modelName};
  }

  async get(id: string) {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async list(filter: Record<string, unknown> = {}) {
    const { data } = await this.model.list(gqlOptions(filter));
    return data;
  }

  async create(input: ${modelName}CreateInput) {
    const { data } = await this.model.create(input, gqlOptions());
    return data;
  }

  async update(input: ${modelName}UpdateInput) {
    const { data } = await this.model.update(input, gqlOptions());
    return data;
  }

  async delete(id: string) {
    await this.model.delete({ id }, gqlOptions());
  }
}
`;
}

// ----------------------------------------------------------
// TEMPLATE: Service (with lazy loading support)
// ----------------------------------------------------------
function templateService(modelName) {
  return `import { ${modelName}Repository } from './${modelName}Repository'
import type { ${modelName} } from './${modelName}';
// import { loadLazy } from '@/data/graphql/lazy'

export class ${modelName}Service {
  constructor(private repo = new ${modelName}Repository()) {}

  async getFull${modelName}(id: string): Promise<${modelName} | null> {
    const item = await this.repo.get(id);
    if (!item) return null;

    // Example for extending lazy relations:
    // const relations = await loadLazy(item.experiences);

    return item;
  }
}
`;
}

// ----------------------------------------------------------
// TEMPLATE: Composable
// ----------------------------------------------------------
function templateComposable(modelName) {
  return `import { ref } from 'vue'
import { ${modelName}Service } from '@/domain/${kebabCase(modelName)}/${modelName}Service'
import type { ${modelName} } from '@/domain/user-profile/${modelName}';

export function use${modelName}(id: string) {
  const item = ref<${modelName} | null>(null);
  const loading = ref(false)
  const service = new ${modelName}Service()

  const load = async () => {
    loading.value = true
    item.value = await service.getFull${modelName}(id)
    loading.value = false
  }

  return { item, loading, load }
}
`;
}

// ----------------------------------------------------------
// MAIN
// ----------------------------------------------------------
const [, , rawModelName] = process.argv;

if (!rawModelName) {
  console.error('Usage: gen-model <ModelName> <schema-file>');
  process.exit(1);
}

const modelName = pascalCase(rawModelName);
const folder = kebabCase(modelName);

const baseDir = path.join(process.cwd(), 'src');

console.log(`📦 Generating scaffolding for ${modelName}...\n`);

// Domain Model
writeFile(path.join(baseDir, `domain/${folder}/${modelName}.ts`), templateModel(modelName));

// Repository
writeFile(
  path.join(baseDir, `domain/${folder}/${modelName}Repository.ts`),
  templateRepository(modelName)
);

// Service
writeFile(
  path.join(baseDir, `domain/${folder}/${modelName}Service.ts`),
  templateService(modelName)
);

// Composable
writeFile(
  path.join(baseDir, `application/${folder}/use${modelName}.ts`),
  templateComposable(modelName)
);

console.log(`\n🎉 Done! ${modelName} scaffolding created successfully.\n`);
