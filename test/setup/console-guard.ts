/**
 * Global Console Guard for Vitest
 *
 * Enforces zero console output during tests unless explicitly allowed.
 * Any unexpected console usage fails the test with clear error messages.
 *
 * @example
 * // Default: console output fails the test
 * test('my test', () => {
 *   console.log('oops'); // ❌ FAILS with clear message
 * });
 *
 * @example
 * // Opt-in: explicitly allow and assert console output
 * test('error handling', async () => {
 *   await allowConsoleOutput(async () => {
 *     someFunction(); // logs internally
 *   });
 *
 *   const calls = getConsoleCalls();
 *   expect(calls.some(c => c.method === 'error')).toBe(true);
 * });
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Console methods to intercept
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
type ConsoleMethod = (typeof CONSOLE_METHODS)[number];

interface ConsoleCall {
  method: ConsoleMethod;
  args: unknown[];
  timestamp: number;
}

// State for current test
let consoleCalls: ConsoleCall[] = [];
let consoleAllowedInTest = false; // Track if this test allowed console
let consoleSpies: Map<ConsoleMethod, ReturnType<typeof vi.spyOn>> = new Map();

/**
 * Allows console output for a specific code block.
 * Use this to wrap code that intentionally logs.
 *
 * @example
 * await allowConsoleOutput(async () => {
 *   // code that logs
 * });
 */
export async function allowConsoleOutput<T>(fn: () => T | Promise<T>): Promise<T> {
  // Mark that this test explicitly allows console
  consoleAllowedInTest = true;
  return await fn();
}

/**
 * Returns all console calls captured during the test.
 * Useful for asserting specific log messages.
 *
 * @example
 * const calls = getConsoleCalls();
 * expect(calls.some(c => c.method === 'error')).toBe(true);
 * expect(calls[0].args[0]).toContain('expected error');
 */
export function getConsoleCalls(): Readonly<ConsoleCall[]> {
  return [...consoleCalls];
}

/**
 * Clears captured console calls.
 * Automatically called between tests, but can be used manually.
 */
export function clearConsoleCalls(): void {
  consoleCalls = [];
}

// Global setup/teardown
beforeEach(() => {
  // Reset state
  consoleCalls = [];
  consoleAllowedInTest = false;

  // Spy on all console methods
  CONSOLE_METHODS.forEach((method) => {
    const spy = vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      // Capture the call
      consoleCalls.push({
        method,
        args,
        timestamp: Date.now(),
      });

      // Swallow output - never print to terminal
    });
    consoleSpies.set(method, spy);
  });
});

afterEach(() => {
  // Restore all mocks
  consoleSpies.forEach((spy) => spy.mockRestore());
  consoleSpies.clear();

  // Check if console was used unexpectedly
  if (!consoleAllowedInTest && consoleCalls.length > 0) {
    // Format captured calls for error message
    const callsSummary = consoleCalls
      .map((call, idx) => {
        const argsStr = call.args
          .map((arg) => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return `Error: ${arg.message}`;
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          })
          .join(' ');
        return `  ${idx + 1}. console.${call.method}(${argsStr})`;
      })
      .join('\n');

    // Clear state before throwing to prevent double-reporting
    const callCount = consoleCalls.length;
    consoleCalls = [];

    // Fail the test with a helpful message
    throw new Error(
      `❌ Unexpected console output detected (${callCount} call${callCount > 1 ? 's' : ''})

Console output is not allowed during tests to keep test results clean.

Captured console calls:
${callsSummary}

If this console output is intentional (e.g., testing error handling):
→ Wrap your code with allowConsoleOutput():

  await allowConsoleOutput(async () => {
    // your code that logs
  });

  const calls = getConsoleCalls();
  expect(calls.some(c => c.method === 'error')).toBe(true);

If this is production code logging unexpectedly:
→ Remove the console statement or handle the error case differently.
`
    );
  }
});
