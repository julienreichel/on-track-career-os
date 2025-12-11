import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/*.skip.ts', '**/node_modules/**'],

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  // Increase timeout for auth-dependent tests
  timeout: 30000,

  // Shared settings for all the projects below
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Ensure cookies and localStorage are persisted
    storageState: undefined, // Will be overridden per project
  },

  // Configure projects for auth setup and tests
  projects: [
    // Setup project - runs authentication before tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
    },
    // Test projects that depend on setup
    {
      name: 'chromium',
      use: {
        ...{
          baseURL: process.env.BASE_URL || 'http://localhost:3000',
          trace: 'on-first-retry',
          screenshot: 'only-on-failure',
          video: 'retain-on-failure',
        },
        // CRITICAL: Use saved auth state for all tests
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
