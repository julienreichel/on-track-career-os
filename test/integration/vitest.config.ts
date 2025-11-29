import { defineVitestConfig } from '@nuxt/test-utils/config';

/**
 * Integration test configuration
 * For testing component interactions and page flows
 */
export default defineVitestConfig({
  test: {
    name: 'integration',
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
  },
});
