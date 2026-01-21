import { CVSettingsRepository } from './CVSettingsRepository';
import type { CVSettings, CVSettingsUpdateInput } from './CVSettings';

export class CVSettingsService {
  constructor(private repo = new CVSettingsRepository()) {}

  async getOrCreate(userId: string): Promise<CVSettings | null> {
    return this.repo.getOrCreate(userId);
  }

  async saveSettings(input: CVSettingsUpdateInput): Promise<CVSettings | null> {
    return this.repo.update(input);
  }
}
