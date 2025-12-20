import { beforeAll, afterAll } from 'vitest';

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const noop = () => {};

beforeAll(() => {
  console.log = noop as typeof console.log;
  console.error = noop as typeof console.error;
  console.warn = noop as typeof console.warn;
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
});
