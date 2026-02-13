import { AiOperationsRepository, type IAiOperationsRepository } from '@/domain/ai-operations/AiOperationsRepository';
import type { EvaluateApplicationStrengthInput } from '@/domain/ai-operations/ApplicationStrengthResult';
import {
  normalizeEvaluationDto,
  normalizeImprovementTarget,
  type ApplicationStrengthEvaluation,
} from './ApplicationStrengthEvaluation';

export class ApplicationStrengthRepository {
  constructor(private aiRepo: IAiOperationsRepository = new AiOperationsRepository()) {}

  async evaluate(input: EvaluateApplicationStrengthInput): Promise<ApplicationStrengthEvaluation> {
    const raw = await this.aiRepo.evaluateApplicationStrength(input);
    const normalized = normalizeEvaluationDto(raw);

    const hasCoverLetter = input.coverLetterText.trim().length > 0;

    normalized.topImprovements = normalized.topImprovements.map((improvement) => {
      const document = hasCoverLetter ? improvement.target.document : 'cv';
      const target = normalizeImprovementTarget({
        document,
        anchor: improvement.target.anchor,
      });

      return {
        ...improvement,
        target: {
          document: target.document,
          anchor: target.anchor,
        },
      };
    });

    return normalized;
  }
}
