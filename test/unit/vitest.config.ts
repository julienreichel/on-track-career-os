import { defineVitestConfig } from '@nuxt/test-utils/config';

/**
 * Unit test configuration
 * For testing business logic, services, and composables in isolation
 */
export default defineVitestConfig({
  test: {
    name: 'unit',
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
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
});
