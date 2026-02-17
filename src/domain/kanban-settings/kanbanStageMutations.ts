import type { KanbanStage } from './KanbanSettings';
import { createUniqueStageKey, ensureSystemStages } from './kanbanStages';

const normalizeStageName = (name: string): string => name.trim();

export const addKanbanStage = (stages: ReadonlyArray<KanbanStage>, name: string): KanbanStage[] => {
  const trimmedName = normalizeStageName(name);
  if (!trimmedName) {
    return ensureSystemStages(stages);
  }

  const key = createUniqueStageKey(
    trimmedName,
    stages.map((stage) => stage.key)
  );

  return ensureSystemStages([
    ...stages,
    {
      key,
      name: trimmedName,
      isSystemDefault: false,
    },
  ]);
};

export const removeKanbanStage = (
  stages: ReadonlyArray<KanbanStage>,
  key: string
): KanbanStage[] =>
  ensureSystemStages(stages.filter((stage) => stage.key !== key || stage.isSystemDefault));

export const moveKanbanStage = (
  stages: ReadonlyArray<KanbanStage>,
  from: number,
  to: number
): KanbanStage[] => {
  if (from < 0 || to < 0 || from >= stages.length || to >= stages.length || from === to) {
    return ensureSystemStages(stages);
  }

  const reordered = [...stages];
  const [moved] = reordered.splice(from, 1);
  if (!moved) {
    return ensureSystemStages(stages);
  }
  reordered.splice(to, 0, moved);
  return ensureSystemStages(reordered);
};

export const renameKanbanStage = (
  stages: ReadonlyArray<KanbanStage>,
  key: string,
  name: string
): KanbanStage[] => {
  const trimmedName = normalizeStageName(name);
  if (!trimmedName) {
    return ensureSystemStages(stages);
  }

  return ensureSystemStages(
    stages.map((stage) =>
      stage.key === key
        ? {
            ...stage,
            name: trimmedName,
          }
        : stage
    )
  );
};
