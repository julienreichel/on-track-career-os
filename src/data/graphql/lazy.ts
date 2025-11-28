// src/data/graphql/lazy.ts

import { gqlOptions } from './options';

/**
 * Type for GraphQL lazy loader functions from Amplify Data.
 * These functions load related entities on demand.
 */
type LazyLoader<T = unknown> = (
  args?: Record<string, unknown>,
  options?: Record<string, unknown>
) => Promise<T>;

export async function loadLazy<T = unknown>(
  relationFn: LazyLoader<T>,
  args: Record<string, unknown> = {}
): Promise<T> {
  return relationFn(args, gqlOptions());
}
