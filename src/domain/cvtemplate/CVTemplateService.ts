import { CVTemplateRepository } from './CVTemplateRepository';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import type { CVTemplate, CVTemplateCreateInput } from './CVTemplate';

export class CVTemplateService {
  constructor(
    private repo = new CVTemplateRepository(),
    private userRepo = new UserProfileRepository()
  ) {}

  async get(id: string): Promise<CVTemplate | null> {
    return this.repo.get(id);
  }

  async listForUser(userId: string): Promise<CVTemplate[]> {
    return this.userRepo.getCvTemplatesSnapshot(userId);
  }

  async createFromExemplar(input: CVTemplateCreateInput): Promise<CVTemplate | null> {
    return this.repo.createFromExemplar(input);
  }
}
