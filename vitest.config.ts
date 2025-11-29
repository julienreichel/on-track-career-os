import { defineVitestConfig } from '@nuxt/test-utils/config';

/**
 * Root Vitest configuration for Nuxt project
 * See: https://nuxt.com/docs/getting-started/testing
 */
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        rootDir: '.',
      },
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      all: true,
      include: ['**/*.ts', '**/*.vue'],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/tests/**',
        'test/**',
        'amplify/**',
        'node_modules/**',
        '**/*.d.ts',
        'src/data/amplify/**',
        '**/plugins/*.ts',
        '**/app.vue',
      ],
    },
  },
});
