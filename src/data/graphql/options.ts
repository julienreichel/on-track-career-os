// src/data/graphql/options.ts

export const GRAPHQL_OPTIONS = {
  default: {
    authMode: 'userPool' as const,
  },
};

export function gqlOptions(custom?: Record<string, unknown>) {
  return {
    ...GRAPHQL_OPTIONS.default,
    ...(custom ?? {}),
  };
}
