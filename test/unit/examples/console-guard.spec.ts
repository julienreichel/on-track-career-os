/**
 * Example tests demonstrating console guard usage
 *
 * These examples show how to work with the global console interception system.
 */

import { describe, it, expect } from 'vitest';
import { allowConsoleOutput, getConsoleCalls } from '../../setup/console-guard';

describe('Console Guard Examples', () => {
  it('should fail when console output is not allowed (commented out to prevent failure)', async () => {
    // ❌ This would fail the test:
    // console.log('oops');

    // ✅ This passes - no console output
    expect(true).toBe(true);
  });

  it('should allow explicitly permitted console output', async () => {
    await allowConsoleOutput(async () => {
      console.log('This is allowed');
      console.error('Error logging is also allowed');
      console.warn('Warnings too');
    });

    // Test passes - console output was explicitly allowed
    expect(true).toBe(true);
  });

  it('should capture and allow assertions on console calls', async () => {
    await allowConsoleOutput(async () => {
      console.error('Something went wrong');
      console.log('Debug info');
    });

    const calls = getConsoleCalls();

    // Assert on captured calls
    expect(calls).toHaveLength(2);
    expect(calls[0].method).toBe('error');
    expect(calls[0].args[0]).toBe('Something went wrong');
    expect(calls[1].method).toBe('log');
    expect(calls[1].args[0]).toBe('Debug info');
  });

  it('should test error handling with console assertions', async () => {
    // Function that logs errors internally
    const functionThatLogs = () => {
      try {
        throw new Error('Test error');
      } catch (err) {
        console.error('[test] Error occurred:', err);
      }
    };

    await allowConsoleOutput(() => {
      functionThatLogs();
    });

    const calls = getConsoleCalls();

    // Verify error was logged
    expect(calls.some((c) => c.method === 'error')).toBe(true);
    expect(calls[0].args[0]).toContain('[test] Error occurred');
  });

  it('should handle async code with console output', async () => {
    const asyncFunction = async () => {
      await Promise.resolve();
      console.log('Async operation completed');
    };

    await allowConsoleOutput(async () => {
      await asyncFunction();
    });

    const calls = getConsoleCalls();
    expect(calls[0].args[0]).toBe('Async operation completed');
  });
});
