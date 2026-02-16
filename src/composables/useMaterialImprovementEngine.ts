import { computed, ref, type Ref } from 'vue';
import { useAnalytics } from '@/composables/useAnalytics';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import {
  MaterialImprovementService,
  resolveMaterialImprovementErrorKey,
  type MaterialImproveGroundingContext,
} from '@/application/materials/materialImprovementService';
import type { ApplicationStrengthEvaluationInput } from '@/domain/application-strength/ApplicationStrengthEvaluation';
import type { ImproveMaterialType } from '@/domain/ai-operations/ImproveMaterial';
import { logError } from '@/utils/logError';

export type MaterialImprovementState = 'idle' | 'analyzing' | 'ready' | 'improving' | 'error';

type MaybeRefString = string | null | Ref<string | null>;

type MaterialImprovementDependencies = {
  service: MaterialImprovementService;
  analytics: Pick<ReturnType<typeof useAnalytics>, 'captureEvent'>;
  errorDisplay: ReturnType<typeof useErrorDisplay>;
};

export type UseMaterialImprovementEngineOptions = {
  materialType: ImproveMaterialType;
  currentDocumentId: MaybeRefString;
  jobId?: MaybeRefString;
  companyId?: MaybeRefString;
  getCurrentMarkdown: () => string;
  setCurrentMarkdown: (markdown: string) => void | Promise<void>;
  getFeedbackInput: () => ApplicationStrengthEvaluationInput;
  getGroundingContext: () => MaterialImproveGroundingContext;
  initialPresets?: string[];
  initialNote?: string;
  dependencies?: Partial<MaterialImprovementDependencies>;
};

type FeedbackResult = Awaited<ReturnType<MaterialImprovementService['runFeedback']>>;

type EngineContext = {
  options: UseMaterialImprovementEngineOptions;
  deps: MaterialImprovementDependencies;
  state: Ref<MaterialImprovementState>;
  details: Ref<FeedbackResult | null>;
  presets: Ref<string[]>;
  note: Ref<string>;
  clearError: () => void;
};

function resolveMaybeRef(value: MaybeRefString | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string' || value === null) {
    return value;
  }

  return value.value;
}

function createDependencies(
  overrides?: Partial<MaterialImprovementDependencies>
): MaterialImprovementDependencies {
  return {
    service: overrides?.service ?? new MaterialImprovementService(),
    analytics: overrides?.analytics ?? useAnalytics(),
    errorDisplay: overrides?.errorDisplay ?? useErrorDisplay(),
  };
}

function createRunFeedback(context: EngineContext) {
  return async () => {
    context.clearError();
    context.state.value = 'analyzing';

    context.deps.analytics.captureEvent('material_improvement_feedback_started', {
      material_type: context.options.materialType,
      document_id: resolveMaybeRef(context.options.currentDocumentId) ?? undefined,
      job_id: resolveMaybeRef(context.options.jobId) ?? undefined,
      company_id: resolveMaybeRef(context.options.companyId) ?? undefined,
    });

    try {
      const evaluation = await context.deps.service.runFeedback(context.options.getFeedbackInput());
      context.details.value = evaluation;
      context.state.value = 'ready';

      context.deps.analytics.captureEvent('material_improvement_feedback_succeeded', {
        material_type: context.options.materialType,
        overall_score: evaluation.overallScore,
      });

      return evaluation;
    } catch (error) {
      context.state.value = 'error';
      const key = resolveMaterialImprovementErrorKey(error, 'feedback');
      context.deps.errorDisplay.setPageError(
        error instanceof Error ? error.message : 'Feedback failed',
        key
      );
      context.deps.analytics.captureEvent('material_improvement_feedback_failed', {
        material_type: context.options.materialType,
        error_key: key,
      });
      logError('Material feedback failed', error, {
        materialType: context.options.materialType,
        errorKey: key,
      });
      throw error;
    }
  };
}

function createRunImprove(context: EngineContext) {
  return async () => {
    context.clearError();
    context.state.value = 'improving';
    const selectedPresets = [...context.presets.value];
    const noteValue = context.note.value;
    context.presets.value = [];
    context.note.value = '';

    context.deps.analytics.captureEvent('material_improvement_started', {
      material_type: context.options.materialType,
      document_id: resolveMaybeRef(context.options.currentDocumentId) ?? undefined,
      preset_count: selectedPresets.length,
    });

    try {
      const improvedMarkdown = await context.deps.service.runImprove({
        materialType: context.options.materialType,
        currentMarkdown: context.options.getCurrentMarkdown(),
        evaluation: context.details.value,
        instructions: {
          presets: selectedPresets,
          note: noteValue,
        },
        grounding: context.options.getGroundingContext(),
      });

      await context.options.setCurrentMarkdown(improvedMarkdown);
      // Improvement invalidates prior feedback because the document content changed.
      context.details.value = null;
      context.state.value = 'idle';

      context.deps.analytics.captureEvent('material_improvement_succeeded', {
        material_type: context.options.materialType,
        improved_length: improvedMarkdown.length,
      });

      return improvedMarkdown;
    } catch (error) {
      context.state.value = 'error';
      const key = resolveMaterialImprovementErrorKey(error, 'improve');
      context.deps.errorDisplay.setPageError(
        error instanceof Error ? error.message : 'Improve failed',
        key
      );
      context.deps.analytics.captureEvent('material_improvement_failed', {
        material_type: context.options.materialType,
        error_key: key,
      });
      logError('Material improve failed', error, {
        materialType: context.options.materialType,
        errorKey: key,
      });
      throw error;
    }
  };
}

export function useMaterialImprovementEngine(options: UseMaterialImprovementEngineOptions) {
  const deps = createDependencies(options.dependencies);
  const state = ref<MaterialImprovementState>('idle');
  const details = ref<FeedbackResult | null>(null);
  const presets = ref<string[]>(options.initialPresets ?? []);
  const note = ref(options.initialNote ?? '');

  const score = computed(() => details.value?.overallScore ?? null);
  const canImprove = computed(
    () => state.value === 'ready' && details.value !== null && presets.value.length > 0
  );

  const clearError = () => {
    deps.errorDisplay.clearPageError();
  };
  const context: EngineContext = { options, deps, state, details, presets, note, clearError };
  const runFeedback = createRunFeedback(context);
  const runImprove = createRunImprove(context);

  const reset = () => {
    details.value = null;
    state.value = 'idle';
    clearError();
  };

  const setPresets = (value: string[]) => {
    presets.value = value.filter((preset) => preset.trim().length > 0);
  };

  const setNote = (value: string) => {
    note.value = value;
  };

  return {
    state,
    score,
    details,
    presets,
    note,
    canImprove,
    actions: {
      runFeedback,
      runImprove,
      reset,
      setPresets,
      setNote,
      clearError,
    },
  };
}
