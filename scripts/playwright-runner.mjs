#!/usr/bin/env node
/**
 * Playwright E2E Test Runner
 * 
 * This wrapper prevents conflicts between Vitest and Playwright matchers
 * by running Playwright with explicit no-install flag to avoid module conflicts.
 */

import { spawn } from 'child_process';

// Run playwright with --no flag to prevent package.json script resolution
const args = process.argv.slice(2);
const playwright = spawn('npx', ['playwright', 'test', ...args], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    // Explicitly clear any test-related env vars that might trigger vitest
    NODE_ENV: 'e2e',
    VITEST: undefined,
    VITEST_POOL_ID: undefined,
  }
});

playwright.on('exit', (code) => {
  process.exit(code || 0);
});
