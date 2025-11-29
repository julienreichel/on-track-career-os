import { defineVitestConfig } from '@nuxt/test-utils/config';
import { resolve } from 'node:path';

export default defineVitestConfig({
  test: {
    environment: 'node', // Use node environment for unit tests, not full Nuxt environment
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src'),
      '@amplify': resolve(__dirname, './amplify'),
      '#app': resolve(__dirname, './node_modules/nuxt/dist/app'),
    },
  },
});
