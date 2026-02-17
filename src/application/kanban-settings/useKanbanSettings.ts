import { ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { KanbanSettingsService } from '@/domain/kanban-settings/KanbanSettingsService';
import type { KanbanStage } from '@/domain/kanban-settings/KanbanSettings';
import { ensureSystemStages, getDefaultKanbanStages } from '@/domain/kanban-settings/kanbanStages';
import {
  addKanbanStage,
  moveKanbanStage,
  removeKanbanStage,
  renameKanbanStage,
} from '@/domain/kanban-settings/kanbanStageMutations';

type AuthComposable = {
  userId: { value: string | null };
  loadUserId: () => Promise<void>;
};

type UseKanbanSettingsOptions = {
  auth?: AuthComposable;
  service?: KanbanSettingsService;
};

export const useKanbanSettings = (options: UseKanbanSettingsOptions = {}) => {
  const auth = options.auth ?? useAuthUser();
  const service = options.service ?? new KanbanSettingsService();

  const stages = ref<KanbanStage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const ensureUserId = async (): Promise<string> => {
    if (!auth.userId.value) {
      await auth.loadUserId();
    }

    if (!auth.userId.value) {
      throw new Error('Missing user id');
    }

    return auth.userId.value;
  };

  const load = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const userId = await ensureUserId();
      const result = await service.getOrCreateKanbanSettings(userId);
      stages.value = ensureSystemStages(result?.stages ?? getDefaultKanbanStages());
      return stages.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const save = async (nextStages: ReadonlyArray<KanbanStage> = stages.value) => {
    isLoading.value = true;
    error.value = null;

    try {
      const userId = await ensureUserId();
      const ensuredStages = ensureSystemStages(nextStages);
      const result = await service.updateKanbanStages(userId, ensuredStages);
      stages.value = ensureSystemStages(result?.stages ?? ensuredStages);
      return stages.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addStage = (name: string) => {
    stages.value = addKanbanStage(stages.value, name);
    return stages.value;
  };

  const removeStage = (key: string) => {
    stages.value = removeKanbanStage(stages.value, key);
    return stages.value;
  };

  const moveStage = (from: number, to: number) => {
    stages.value = moveKanbanStage(stages.value, from, to);
    return stages.value;
  };

  const renameStage = (key: string, name: string) => {
    stages.value = renameKanbanStage(stages.value, key, name);
    return stages.value;
  };

  const state = {
    stages,
    isLoading,
    error,
  };

  return {
    state,
    load,
    save,
    addStage,
    removeStage,
    moveStage,
    renameStage,
  };
};
