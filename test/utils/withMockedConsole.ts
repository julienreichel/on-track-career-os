import { vi } from 'vitest';

type ConsoleMethod = 'log' | 'warn' | 'error';
type MaybePromise<T> = T | Promise<T>;

export function withMockedConsole<T extends () => MaybePromise<unknown>>(
  method: ConsoleMethod,
  fn: T
) {
  return async () => {
    const spy = vi.spyOn(console, method).mockImplementation(() => {});
    try {
      return await fn();
    } finally {
      spy.mockRestore();
    }
  };
}

export const withMockedConsoleError = <T extends () => MaybePromise<unknown>>(fn: T) =>
  withMockedConsole('error', fn);
