import type { KanbanStage } from './KanbanSettings';

const SYSTEM_STAGE_NAMES = {
  todo: 'ToDo',
  done: 'Done',
} as const;

const DEFAULT_STAGE_NAMES = {
  todo: 'ToDo',
  applied: 'Applied',
  interview: 'Interview',
  done: 'Done',
} as const;

export const DEFAULT_KANBAN_STAGE_KEYS = ['todo', 'applied', 'interview', 'done'] as const;

export type KanbanStageInput = Partial<KanbanStage> | null | undefined;

export const getDefaultKanbanStages = (): KanbanStage[] =>
  DEFAULT_KANBAN_STAGE_KEYS.map((key) => ({
    key,
    name: DEFAULT_STAGE_NAMES[key],
    isSystemDefault: key === 'todo' || key === 'done',
  }));

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const DEFAULT_CUSTOM_STAGE_KEY = 'stage';

export const createUniqueStageKey = (
  name: string,
  existingKeys: ReadonlyArray<string | null | undefined>
): string => {
  const normalizedBase = normalizeKey(name);
  const base = normalizedBase || DEFAULT_CUSTOM_STAGE_KEY;
  const used = new Set(existingKeys.filter((key): key is string => Boolean(key)));

  if (!used.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
};

const toStageName = (key: string): string =>
  key
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const sanitizeStages = (stages: ReadonlyArray<KanbanStageInput>): KanbanStage[] => {
  const seen = new Set<string>();
  const sanitized: KanbanStage[] = [];

  for (const stage of stages) {
    if (!stage) {
      continue;
    }

    const derivedKey = normalizeKey(stage.key ?? '') || normalizeKey(stage.name ?? '');
    if (!derivedKey || seen.has(derivedKey)) {
      continue;
    }

    seen.add(derivedKey);
    sanitized.push({
      key: derivedKey,
      name: (stage.name ?? '').trim() || toStageName(derivedKey),
      isSystemDefault: Boolean(stage.isSystemDefault),
    });
  }

  return sanitized;
};

export const ensureSystemStages = (stages: ReadonlyArray<KanbanStageInput>): KanbanStage[] => {
  const sanitized = sanitizeStages(stages);
  const customStages = sanitized
    .filter((stage) => stage.key !== 'todo' && stage.key !== 'done')
    .map((stage) => ({
      ...stage,
      isSystemDefault: false,
    }));

  return [
    {
      key: 'todo',
      name: SYSTEM_STAGE_NAMES.todo,
      isSystemDefault: true,
    },
    ...customStages,
    {
      key: 'done',
      name: SYSTEM_STAGE_NAMES.done,
      isSystemDefault: true,
    },
  ];
};
