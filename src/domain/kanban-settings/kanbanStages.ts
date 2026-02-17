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
  const withSystemDefaults = sanitized.map((stage) => {
    if (stage.key === 'todo') {
      return {
        key: 'todo',
        name: SYSTEM_STAGE_NAMES.todo,
        isSystemDefault: true,
      } satisfies KanbanStage;
    }

    if (stage.key === 'done') {
      return {
        key: 'done',
        name: SYSTEM_STAGE_NAMES.done,
        isSystemDefault: true,
      } satisfies KanbanStage;
    }

    return {
      ...stage,
      isSystemDefault: false,
    } satisfies KanbanStage;
  });

  if (!withSystemDefaults.some((stage) => stage.key === 'todo')) {
    withSystemDefaults.unshift({
      key: 'todo',
      name: SYSTEM_STAGE_NAMES.todo,
      isSystemDefault: true,
    });
  }

  if (!withSystemDefaults.some((stage) => stage.key === 'done')) {
    withSystemDefaults.push({
      key: 'done',
      name: SYSTEM_STAGE_NAMES.done,
      isSystemDefault: true,
    });
  }

  return withSystemDefaults;
};
