import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */

// Constants
const CI_RETRIES = 2;
const MAX_WORKERS_CI = 1;
const SERVER_TIMEOUT_SECONDS = 120;
const MS_PER_SECOND = 1000;

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.spec.ts',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? CI_RETRIES : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? MAX_WORKERS_CI : undefined,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Test project that depends on setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use signed-in state from setup
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: SERVER_TIMEOUT_SECONDS * MS_PER_SECOND,
  },
});
