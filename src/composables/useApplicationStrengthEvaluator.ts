import { ref } from 'vue';
import { ApplicationStrengthService } from '@/domain/application-strength/ApplicationStrengthService';
import type {
  ApplicationStrengthEvaluation,
  ApplicationStrengthEvaluationInput,
} from '@/domain/application-strength/ApplicationStrengthEvaluation';

export function useApplicationStrengthEvaluator() {
  const service = new ApplicationStrengthService();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const evaluation = ref<ApplicationStrengthEvaluation | null>(null);

  const evaluate = async (input: ApplicationStrengthEvaluationInput) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await service.evaluate(input);
      evaluation.value = result;
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to evaluate application strength';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    loading.value = false;
    error.value = null;
    evaluation.value = null;
  };

  return {
    loading,
    error,
    evaluation,
    evaluate,
    reset,
  };
}
