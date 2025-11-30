#!/usr/bin/env node
/**
 * Nuxt + Amplify Gen2 Clean Architecture Scaffolder (ESM version)
 * ---------------------------------------------------------------
 * Generates:
 *   src/domain/<model>/<Model>.ts
 *   src/domain/<model>/<Model>Repository.ts
 *   src/domain/<model>/<Model>Service.ts
 *   src/application/<model>/use<Model>.ts
 *   test/unit/domain/<model>/<Model>Service.spec.ts
 *   test/unit/application/<model>/use<Model>.spec.ts
 *
 * Usage:
 *   npx gen-model ${modelName}
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
  return `import { gqlOptions } from '@/data/graphql/options';
import type { ${modelName}CreateInput, ${modelName}UpdateInput, ${modelName} } from './${modelName}';

export type Amplify${modelName}Model = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: ${modelName} | null }>;
  list: (options?: Record<string, unknown>) => Promise<{ data: ${modelName}[] }>;
  create: (
    input: ${modelName}CreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: ${modelName} | null }>;
  update: (
    input: ${modelName}UpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: ${modelName} | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: ${modelName} | null }>;
};

export class ${modelName}Repository {
  private readonly _model: Amplify${modelName}Model;

  /**
   * Constructor with optional dependency injection for testing
   * @param model - Optional Amplify model instance (for testing)
   */
  constructor(model?: Amplify${modelName}Model) {
    if (model) {
      // Use injected model (for tests)
      this._model = model;
    } else {
      // Use Nuxt's auto-imported useNuxtApp (for production)
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.${modelName};
    }
  }

  private get model() {
    return this._model;
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
// TEMPLATE: Service Test
// ----------------------------------------------------------
function templateServiceTest(modelName) {
  const folder = kebabCase(modelName);
  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${modelName}Service } from '@/domain/${folder}/${modelName}Service';
import { ${modelName}Repository } from '@/domain/${folder}/${modelName}Repository';
import type { ${modelName} } from '@/domain/${folder}/${modelName}';

// Mock the repository
vi.mock('@/domain/${folder}/${modelName}Repository');

describe('${modelName}Service', () => {
  let service: ${modelName}Service;
  let mockRepository: ReturnType<typeof vi.mocked<${modelName}Repository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<${modelName}Repository>>;

    service = new ${modelName}Service(mockRepository);
  });

  describe('getFull${modelName}', () => {
    it('should fetch a complete ${modelName} by id', async () => {
      const mock${modelName} = {
        id: '${modelName.toLowerCase()}-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as ${modelName};

      mockRepository.get.mockResolvedValue(mock${modelName});

      const result = await service.getFull${modelName}('${modelName.toLowerCase()}-123');

      expect(mockRepository.get).toHaveBeenCalledWith('${modelName.toLowerCase()}-123');
      expect(result).toEqual(mock${modelName});
    });

    it('should return null when ${modelName} does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFull${modelName}('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    // TODO: Add more tests for lazy loading and relations
  });
});
`;
}

// ----------------------------------------------------------
// TEMPLATE: Composable Test
// ----------------------------------------------------------
function templateComposableTest(modelName) {
  const folder = kebabCase(modelName);
  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { use${modelName} } from '@/application/${folder}/use${modelName}';
import { ${modelName}Service } from '@/domain/${folder}/${modelName}Service';
import type { ${modelName} } from '@/domain/${folder}/${modelName}';

// Mock the ${modelName}Service
vi.mock('@/domain/${folder}/${modelName}Service');

describe('use${modelName}', () => {
  let mockService: ReturnType<typeof vi.mocked<${modelName}Service>>;

  beforeEach(() => {
    mockService = {
      getFull${modelName}: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<${modelName}Service>>;

    // Mock the constructor to return our mock service
    vi.mocked(${modelName}Service).mockImplementation(() => mockService);
  });

  it('should initialize with null item and loading false', () => {
    const { item, loading } = use${modelName}('${modelName.toLowerCase()}-123');

    expect(item.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it('should load ${modelName} successfully', async () => {
    const mock${modelName} = {
      id: '${modelName.toLowerCase()}-123',
      // TODO: Add model-specific fields
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      owner: 'user-123::user-123',
    } as ${modelName};

    mockService.getFull${modelName}.mockResolvedValue(mock${modelName});

    const { item, loading, load } = use${modelName}('${modelName.toLowerCase()}-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();

    // Loading should be true during the async operation
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(item.value).toEqual(mock${modelName});
    expect(mockService.getFull${modelName}).toHaveBeenCalledWith('${modelName.toLowerCase()}-123');
  });

  it('should handle loading state correctly', async () => {
    mockService.getFull${modelName}.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { loading, load } = use${modelName}('${modelName.toLowerCase()}-123');

    expect(loading.value).toBe(false);

    const loadPromise = load();
    expect(loading.value).toBe(true);

    await loadPromise;
    expect(loading.value).toBe(false);
  });

  it('should set item to null when ${modelName} not found', async () => {
    mockService.getFull${modelName}.mockResolvedValue(null);

    const { item, load } = use${modelName}('non-existent-id');

    await load();

    expect(item.value).toBeNull();
    expect(mockService.getFull${modelName}).toHaveBeenCalledWith('non-existent-id');
  });

  // TODO: Add more tests for error handling and edge cases
});
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

// Tests
const testBaseDir = path.join(process.cwd(), 'test/unit');

// Service Test
writeFile(
  path.join(testBaseDir, `domain/${folder}/${modelName}Service.spec.ts`),
  templateServiceTest(modelName)
);

// Composable Test
writeFile(
  path.join(testBaseDir, `application/${folder}/use${modelName}.spec.ts`),
  templateComposableTest(modelName)
);

console.log(`\n🎉 Done! ${modelName} scaffolding created successfully.\n`);
