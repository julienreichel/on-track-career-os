import { ref } from 'vue';
import { useAnalytics } from '@/composables/useAnalytics';
import { logError } from '@/utils/logError';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';
import type {
  ApplicationStrengthEvaluation,
  ApplicationStrengthEvaluationInput,
} from '@/domain/application-strength/ApplicationStrengthEvaluation';

export type ApplicationStrengthEvaluatorStatus = 'idle' | 'loading' | 'success' | 'error';
export type ApplicationStrengthEvaluatorErrorCode =
  | 'validation'
  | 'operation_failed'
  | 'unknown';

function resolveErrorCode(error: unknown): ApplicationStrengthEvaluatorErrorCode {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  if (
    error.message.includes('Job title is required') ||
    error.message.includes('At least one document is required') ||
    error.message.includes('Language cannot be empty')
  ) {
    return 'validation';
  }

  if (error.message.includes('Invalid application strength result')) {
    return 'operation_failed';
  }

  return 'unknown';
}

function resolveErrorMessageKey(code: ApplicationStrengthEvaluatorErrorCode): string {
  switch (code) {
    case 'validation':
      return 'applicationStrength.errors.validation';
    case 'operation_failed':
      return 'applicationStrength.errors.aiValidation';
    default:
      return 'applicationStrength.errors.evaluationFailed';
  }
}

export function useApplicationStrengthEvaluator() {
  const { captureEvent } = useAnalytics();
  const service = new ApplicationStrengthService();
  const status = ref<ApplicationStrengthEvaluatorStatus>('idle');
  const evaluation = ref<ApplicationStrengthEvaluation | null>(null);
  const errorCode = ref<ApplicationStrengthEvaluatorErrorCode | null>(null);
  const errorMessageKey = ref<string | null>(null);
  const rawError = ref<unknown>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const evaluate = async (input: ApplicationStrengthEvaluationInput) => {
    captureEvent('application_strength_evaluation_started', {
      has_cv: Boolean(input.cvText?.trim()),
      has_cover_letter: Boolean(input.coverLetterText?.trim()),
    });

    status.value = 'loading';
    loading.value = true;
    error.value = null;
    errorCode.value = null;
    errorMessageKey.value = null;
    rawError.value = null;

    try {
      const result = await service.evaluate(input);
      evaluation.value = result;
      status.value = 'success';
      captureEvent('application_strength_evaluation_succeeded', {
        overall_score: result.overallScore,
      });
      return result;
    } catch (err) {
      status.value = 'error';
      rawError.value = err;
      const code = resolveErrorCode(err);
      errorCode.value = code;
      errorMessageKey.value = resolveErrorMessageKey(code);
      error.value = err instanceof Error ? err.message : 'Failed to evaluate application strength';
      captureEvent('application_strength_evaluation_failed', {
        error_code: code,
      });
      logError('Application strength evaluation failed', err, {
        errorCode: code,
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    status.value = 'idle';
    loading.value = false;
    error.value = null;
    evaluation.value = null;
    errorCode.value = null;
    errorMessageKey.value = null;
    rawError.value = null;
  };

  return {
    status,
    errorCode,
    errorMessageKey,
    rawError,
    loading,
    error,
    evaluation,
    evaluate,
    reset,
  };
}
