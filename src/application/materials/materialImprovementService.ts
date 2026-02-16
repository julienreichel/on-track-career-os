import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';
import type {
  ApplicationStrengthEvaluation,
  ApplicationStrengthEvaluationInput,
} from '@/domain/application-strength/ApplicationStrengthEvaluation';
import type {
  ImproveMaterialInput,
  ImproveMaterialType,
} from '@/domain/ai-operations/ImproveMaterial';
import {
  AiOperationsRepository,
  type IAiOperationsRepository,
} from '@/domain/ai-operations/AiOperationsRepository';
import type {
  CompanyProfile,
  Experience,
  ImproveMaterialInstructions,
  JobDescription,
  MatchingSummaryContext,
  Profile,
  SpeechStory,
} from '@amplify/data/ai-operations/types/schema-types';
import { MATERIAL_IMPROVEMENT_OTHER_PRESET } from '@/domain/materials/improvementPresets';

export type MaterialImprovementErrorKey =
  | 'materialImprovement.errors.feedbackValidation'
  | 'materialImprovement.errors.feedbackFailed'
  | 'materialImprovement.errors.feedbackRequired'
  | 'materialImprovement.errors.emptyMarkdown'
  | 'materialImprovement.errors.invalidPayload'
  | 'materialImprovement.errors.invalidOutput'
  | 'materialImprovement.errors.improveFailed';

const FEEDBACK_REQUIRED_CODE = 'ERR_MATERIAL_IMPROVEMENT_FEEDBACK_REQUIRED';
const EMPTY_MARKDOWN_CODE = 'ERR_MATERIAL_IMPROVEMENT_EMPTY_MARKDOWN';
const INVALID_MARKDOWN_CODE = 'ERR_MATERIAL_IMPROVEMENT_INVALID_MARKDOWN';

export type MaterialImproveGroundingContext = {
  language?: 'en';
  profile: Profile;
  experiences: Experience[];
  stories?: SpeechStory[];
  jobDescription?: JobDescription;
  matchingSummary?: MatchingSummaryContext;
  company?: CompanyProfile;
};

export type ImproveMaterialRequest = {
  materialType: ImproveMaterialType;
  currentMarkdown: string;
  evaluation: ApplicationStrengthEvaluation | null;
  instructions: {
    presets: string[];
    note?: string;
  };
  grounding: MaterialImproveGroundingContext;
};

type MaterialImprovementServiceDeps = {
  applicationStrengthService: ApplicationStrengthService;
  aiOperationsRepository: IAiOperationsRepository;
};

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);
}

function sanitizeInstructions(instructions: ImproveMaterialRequest['instructions']): ImproveMaterialInstructions {
  const note = sanitizeText(instructions.note);
  const selected = sanitizeStringArray(instructions.presets);
  const presets = selected.filter((preset) => preset !== MATERIAL_IMPROVEMENT_OTHER_PRESET);
  if (selected.includes(MATERIAL_IMPROVEMENT_OTHER_PRESET) && note.length > 0) {
    presets.push(note);
  }

  return {
    presets,
  };
}

export function mapEvaluationToImprovementContext(
  evaluation: ApplicationStrengthEvaluation
): ImproveMaterialInput['improvementContext'] {
  return {
    overallScore: evaluation.overallScore,
    dimensionScores: {
      atsReadiness: evaluation.dimensionScores.atsReadiness,
      clarityFocus: evaluation.dimensionScores.clarityFocus,
      targetedFitSignals: evaluation.dimensionScores.targetedFitSignals,
      evidenceStrength: evaluation.dimensionScores.evidenceStrength,
    },
    decision: {
      label: evaluation.decision.label,
      readyToApply: evaluation.decision.readyToApply,
      rationaleBullets: [...evaluation.decision.rationaleBullets],
    },
    missingSignals: [...evaluation.missingSignals],
    topImprovements: evaluation.topImprovements.map((improvement) => ({
      title: improvement.title,
      action: improvement.action,
      impact: improvement.impact,
      target: {
        document: improvement.target.document,
        anchor: improvement.target.anchor,
      },
    })),
    notes: {
      atsNotes: [...evaluation.notes.atsNotes],
      humanReaderNotes: [...evaluation.notes.humanReaderNotes],
    },
  };
}

export function buildImproveMaterialPayload(input: ImproveMaterialRequest): ImproveMaterialInput {
  const markdown = sanitizeText(input.currentMarkdown);
  if (!markdown) {
    throw new Error(EMPTY_MARKDOWN_CODE);
  }

  if (!input.evaluation) {
    throw new Error(FEEDBACK_REQUIRED_CODE);
  }

  const instructions = sanitizeInstructions(input.instructions);
  if (instructions.presets.length === 0) {
    throw new Error('ERR_IMPROVE_MATERIAL_INVALID_INPUT:instructions.presets');
  }

  return {
    language: input.grounding.language ?? 'en',
    materialType: input.materialType,
    currentMarkdown: markdown,
    instructions,
    improvementContext: mapEvaluationToImprovementContext(input.evaluation),
    profile: input.grounding.profile,
    experiences: input.grounding.experiences,
    ...(input.grounding.stories ? { stories: input.grounding.stories } : {}),
    ...(input.grounding.jobDescription ? { jobDescription: input.grounding.jobDescription } : {}),
    ...(input.grounding.matchingSummary ? { matchingSummary: input.grounding.matchingSummary } : {}),
    ...(input.grounding.company ? { company: input.grounding.company } : {}),
  };
}

export function resolveMaterialImprovementErrorKey(
  error: unknown,
  phase: 'feedback' | 'improve'
): MaterialImprovementErrorKey {
  const message = error instanceof Error ? error.message : '';

  if (phase === 'feedback') {
    if (
      message.includes('Job title is required') ||
      message.includes('At least one document is required') ||
      message.includes('Language cannot be empty')
    ) {
      return 'materialImprovement.errors.feedbackValidation';
    }

    return 'materialImprovement.errors.feedbackFailed';
  }

  if (message.includes(FEEDBACK_REQUIRED_CODE)) {
    return 'materialImprovement.errors.feedbackRequired';
  }

  if (message.includes(EMPTY_MARKDOWN_CODE)) {
    return 'materialImprovement.errors.emptyMarkdown';
  }

  if (
    message.includes('ERR_IMPROVE_MATERIAL_INVALID_INPUT') ||
    message.includes('ERR_IMPROVE_MATERIAL_INVALID_OUTPUT')
  ) {
    return 'materialImprovement.errors.invalidPayload';
  }

  if (
    message.includes(INVALID_MARKDOWN_CODE) ||
    message.includes('ERR_IMPROVE_MATERIAL_RETRY_FAILED_FALLBACK')
  ) {
    return 'materialImprovement.errors.invalidOutput';
  }

  return 'materialImprovement.errors.improveFailed';
}

export class MaterialImprovementService {
  constructor(
    private readonly deps: MaterialImprovementServiceDeps = {
      applicationStrengthService: new ApplicationStrengthService(),
      aiOperationsRepository: new AiOperationsRepository(),
    }
  ) {}

  async runFeedback(input: ApplicationStrengthEvaluationInput): Promise<ApplicationStrengthEvaluation> {
    return this.deps.applicationStrengthService.evaluate(input);
  }

  async runImprove(input: ImproveMaterialRequest): Promise<string> {
    const payload = buildImproveMaterialPayload(input);
    const improvedMarkdown = await this.deps.aiOperationsRepository.improveMaterial(payload);

    if (!sanitizeText(improvedMarkdown)) {
      throw new Error(INVALID_MARKDOWN_CODE);
    }

    return improvedMarkdown;
  }
}
