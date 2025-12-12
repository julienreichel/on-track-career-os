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

/**
 * Type for paginated GraphQL responses from Amplify
 */
interface PaginatedResponse<T> {
  data: T[];
  nextToken?: string | null;
}

/**
 * Load a single page from a lazy relationship
 * @param relationFn - The lazy loader function from Amplify
 * @param args - Optional arguments (filters, etc.)
 * @returns Single page response with data and nextToken
 */
export async function loadLazy<T = unknown>(
  relationFn: LazyLoader<PaginatedResponse<T>>,
  args: Record<string, unknown> = {}
): Promise<PaginatedResponse<T>> {
  return relationFn(args, gqlOptions());
}

/**
 * Load all pages from a lazy relationship by following nextToken
 * This will make multiple requests until all data is fetched
 * @param relationFn - The lazy loader function from Amplify
 * @param args - Optional arguments (filters, etc.)
 * @returns All data from all pages combined
 */
export async function loadLazyAll<T = unknown>(
  relationFn: LazyLoader<PaginatedResponse<T>>,
  args: Record<string, unknown> = {}
): Promise<T[]> {
  const allData: T[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    // Add nextToken to args if we have one
    const requestArgs = nextToken ? { ...args, nextToken } : args;

    // Load the current page
    const response = await relationFn(requestArgs, gqlOptions());

    // Add this page's data to our collection
    if (response.data) {
      allData.push(...response.data);
    }

    // Get the next token for pagination
    nextToken = response.nextToken;
  } while (nextToken);

  return allData;
}

/**
 * Load lazy relationship with pagination control
 * @param relationFn - The lazy loader function from Amplify
 * @param args - Optional arguments (filters, limit, nextToken, etc.)
 * @returns Paginated response with data and nextToken
 */
export async function loadLazyPaginated<T = unknown>(
  relationFn: LazyLoader<PaginatedResponse<T>>,
  args: { limit?: number; nextToken?: string | null; [key: string]: unknown } = {}
): Promise<PaginatedResponse<T>> {
  return relationFn(args, gqlOptions());
}
