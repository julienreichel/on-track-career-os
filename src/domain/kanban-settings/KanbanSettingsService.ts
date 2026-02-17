import { KanbanSettingsRepository } from './KanbanSettingsRepository';
import type { KanbanSettings, KanbanStage } from './KanbanSettings';

export class KanbanSettingsService {
  constructor(private repo = new KanbanSettingsRepository()) {}

  async getOrCreateKanbanSettings(userId: string): Promise<KanbanSettings | null> {
    return this.repo.getOrCreateKanbanSettings(userId);
  }

  async updateKanbanStages(userId: string, stages: KanbanStage[]): Promise<KanbanSettings | null> {
    return this.repo.updateKanbanStages(userId, stages);
  }
}
