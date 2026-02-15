import type { EvaluateApplicationStrengthInput } from '@/domain/ai-operations/ApplicationStrengthResult';
import type { ApplicationStrengthEvaluation } from './ApplicationStrengthEvaluation';
import { ApplicationStrengthRepository } from './ApplicationStrengthRepository';

export interface IApplicationStrengthService {
  evaluate(input: EvaluateApplicationStrengthInput): Promise<ApplicationStrengthEvaluation>;
}

export class ApplicationStrengthService implements IApplicationStrengthService {
  constructor(private repo: ApplicationStrengthRepository = new ApplicationStrengthRepository()) {}

  async evaluate(input: EvaluateApplicationStrengthInput): Promise<ApplicationStrengthEvaluation> {
    if (!input.job?.title?.trim()) {
      throw new Error('Job title is required');
    }
    if (!input.cvText?.trim() && !input.coverLetterText?.trim()) {
      throw new Error('At least one document is required (cvText or coverLetterText).');
    }
    if (!input.language?.trim()) {
      throw new Error('Language cannot be empty');
    }

    return this.repo.evaluate(input);
  }
}
