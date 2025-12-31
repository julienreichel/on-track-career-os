// src/data/graphql/pagination.ts

import { gqlOptions } from './options';

type ListFunction<T> = (
  options?: Record<string, unknown>
) => Promise<{ data: T[]; nextToken?: string | null }>;

/**
 * Fetch all pages from an Amplify list resolver by following the nextToken.
 * Ensures repositories always return the complete dataset rather than a single page.
 */
export async function fetchAllListItems<T>(
  listFn: ListFunction<T>,
  options: Record<string, unknown> = {}
): Promise<T[]> {
  const results: T[] = [];
  let nextToken: string | null | undefined = null;

  do {
    const requestOptions = nextToken ? { ...options, nextToken } : options;
    const response = await listFn(gqlOptions(requestOptions));

    if (response.data?.length) {
      results.push(...response.data);
    }

    nextToken = response.nextToken;
  } while (nextToken);

  return results;
}
