import { gqlOptions } from '@/data/graphql/options';
import type {
  KanbanSettingsCreateInput,
  KanbanSettingsUpdateInput,
  KanbanSettings,
  KanbanStage,
} from './KanbanSettings';
import { ensureSystemStages, getDefaultKanbanStages } from './kanbanStages';

export type AmplifyKanbanSettingsModel = {
  get: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: KanbanSettings | null }>;
  create: (
    input: KanbanSettingsCreateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: KanbanSettings | null }>;
  update: (
    input: KanbanSettingsUpdateInput,
    options?: Record<string, unknown>
  ) => Promise<{ data: KanbanSettings | null }>;
  delete: (
    input: { id: string },
    options?: Record<string, unknown>
  ) => Promise<{ data: KanbanSettings | null }>;
};

export class KanbanSettingsRepository {
  private readonly _model: AmplifyKanbanSettingsModel;

  constructor(model?: AmplifyKanbanSettingsModel) {
    if (model) {
      this._model = model;
    } else {
      this._model = useNuxtApp().$Amplify.GraphQL.client.models.KanbanSettings;
    }
  }

  private get model() {
    return this._model;
  }

  ensureSystemStages(stages: ReadonlyArray<KanbanStage | null | undefined>): KanbanStage[] {
    return ensureSystemStages(stages);
  }

  async get(id: string): Promise<KanbanSettings | null> {
    const res = await this.model.get({ id }, gqlOptions());
    return res.data;
  }

  async getOrCreateKanbanSettings(userId: string): Promise<KanbanSettings | null> {
    if (!userId) {
      throw new Error('userId is required');
    }

    const existing = await this.get(userId);
    if (existing) {
      const normalizedStages = this.ensureSystemStages(existing.stages ?? []);
      const hasChanges = JSON.stringify(existing.stages ?? []) !== JSON.stringify(normalizedStages);
      if (!hasChanges) {
        return existing;
      }

      const { data } = await this.model.update(
        {
          id: userId,
          userId,
          stages: normalizedStages,
        },
        gqlOptions()
      );
      return data;
    }

    const { data } = await this.model.create(
      {
        id: userId,
        userId,
        stages: getDefaultKanbanStages(),
      },
      gqlOptions()
    );
    return data;
  }

  async create(input: KanbanSettingsCreateInput): Promise<KanbanSettings | null> {
    const { data } = await this.model.create(
      {
        ...input,
        stages: this.ensureSystemStages(input.stages ?? []),
      },
      gqlOptions()
    );
    return data;
  }

  async update(input: KanbanSettingsUpdateInput): Promise<KanbanSettings | null> {
    const { data } = await this.model.update(
      {
        ...input,
        stages: this.ensureSystemStages(input.stages ?? []),
      },
      gqlOptions()
    );
    return data;
  }

  async updateKanbanStages(userId: string, stages: KanbanStage[]): Promise<KanbanSettings | null> {
    if (!userId) {
      throw new Error('userId is required');
    }

    const ensuredStages = this.ensureSystemStages(stages);
    const existing = await this.getOrCreateKanbanSettings(userId);
    const id = existing?.id ?? userId;

    const { data } = await this.model.update(
      {
        id,
        userId,
        stages: ensuredStages,
      },
      gqlOptions()
    );
    return data;
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ id }, gqlOptions());
  }
}
