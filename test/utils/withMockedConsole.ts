import { allowConsoleOutput } from '../setup/console-guard';

type MaybePromise<T> = T | Promise<T>;

/**
 * @deprecated Use allowConsoleOutput from console-guard instead.
 * This function delegates to allowConsoleOutput but wraps it to maintain compatibility.
 * The new approach uses the console guard system which properly tracks console calls.
 */
export const withMockedConsoleError = <T extends () => MaybePromise<unknown>>(fn: T) => {
  // Delegate to the new allowConsoleOutput by wrapping it in the same pattern
  return async () => {
    // Use allowConsoleOutput which properly handles the console guard
    return await allowConsoleOutput(fn);
  };
};
