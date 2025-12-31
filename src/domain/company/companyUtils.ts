export function normalizeStringArray(values: Array<string | null | undefined> | null | undefined) {
  if (!values || values.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) {
      continue;
    }
    const normalizedKey = normalized.toLocaleLowerCase();
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      cleaned.push(normalized);
    }
  }

  return cleaned;
}

export function applyArrayNormalization<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(payload: T, keys: K[]): T {
  const clone = { ...payload };
  for (const key of keys) {
    const current = clone[key];
    clone[key] = normalizeStringArray(current as Array<string | null | undefined>) as T[K];
  }
  return clone;
}
