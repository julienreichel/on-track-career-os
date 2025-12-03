import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';
import { resolve } from 'node:path';

/**
 * Vitest workspace configuration for Nuxt project
 * Using projects approach as recommended in Nuxt docs:
 * https://nuxt.com/docs/4.x/getting-started/testing
 */
export default defineConfig({
  test: {
    projects: [
      // Unit tests - run in Node environment for speed
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.spec.ts'],
          environment: 'node',
          coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,vue}'],
            exclude: [
              'src/**/*.spec.ts',
              'src/**/*.test.ts',
              'src/tests/**',
              'test/**',
              'amplify/**',
            ],
          },
        },
        // Configure path aliases for unit tests
        resolve: {
          alias: {
            '@': resolve(__dirname, './src'),
            '~': resolve(__dirname, './src'),
          },
        },
      },
      // Amplify tests - Lambda functions and backend logic
      {
        test: {
          name: 'amplify',
          include: ['test/amplify/**/*.spec.ts'],
          environment: 'node',
          coverage: {
            provider: 'v8',
            include: ['amplify/**/*.ts'],
            exclude: [
              'amplify/**/*.spec.ts',
              'amplify/**/*.test.ts',
              'amplify/backend.ts',
              'amplify/**/resource.ts',
            ],
          },
        },
        // Configure path aliases for amplify tests
        resolve: {
          alias: {
            '@amplify': resolve(__dirname, './amplify'),
          },
        },
      },
      // Nuxt tests - run in Nuxt runtime environment
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.spec.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
              overrides: {
                modules: ['@nuxtjs/i18n'],
              },
            },
          },
        },
      }),
      // E2E Sandbox tests - run against live Amplify sandbox
      {
        test: {
          name: 'e2e-sandbox',
          include: ['test/e2e-sandbox/**/*.spec.ts'],
          environment: 'node',
          testTimeout: 60000, // 60s for AWS operations
        },
        // Configure path aliases for sandbox tests
        resolve: {
          alias: {
            '@': resolve(__dirname, './src'),
            '~': resolve(__dirname, './src'),
          },
        },
      },
    ],
    // Global coverage settings
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'json-summary', 'html'],
      all: true,
      include: ['src/**/*.{ts,vue}', 'amplify/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/tests/**',
        'test/**',
        'node_modules/**',
        '**/*.d.ts',
        'src/data/amplify/**',
        '**/plugins/*.ts',
        '**/app.vue',
        'amplify/backend.ts',
        'amplify/**/resource.ts',
      ],
    },
  },
});
