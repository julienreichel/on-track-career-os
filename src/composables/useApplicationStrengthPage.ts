import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAnalytics } from '@/composables/useAnalytics';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useAuthUser } from '@/composables/useAuthUser';
import { useApplicationStrengthInputs } from '@/composables/useApplicationStrengthInputs';
import { useApplicationStrengthEvaluator } from '@/composables/useApplicationStrengthEvaluator';
import { useErrorDisplay } from '@/composables/useErrorDisplay';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
import { logError } from '@/utils/logError';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { EvaluateApplicationStrengthInput } from '@/domain/ai-operations/ApplicationStrengthResult';

type JobOperationInput = EvaluateApplicationStrengthInput['job'];

function toStringList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter((value): value is string => typeof value === 'string');
}

function mapJobToOperationInput(job: JobDescription): JobOperationInput {
  return {
    title: job.title ?? '',
    seniorityLevel: job.seniorityLevel ?? '',
    roleSummary: job.roleSummary ?? '',
    responsibilities: toStringList(job.responsibilities),
    requiredSkills: toStringList(job.requiredSkills),
    behaviours: toStringList(job.behaviours),
    successCriteria: toStringList(job.successCriteria),
    explicitPains: toStringList(job.explicitPains),
    atsKeywords: toStringList(job.atsKeywords),
  };
}

// eslint-disable-next-line max-lines-per-function
export function useApplicationStrengthPage(jobId: string) {
  const { locale } = useI18n();
  const { captureEvent } = useAnalytics();
  const jobAnalysis = useJobAnalysis();
  const auth = useAuthUser();
  const profileService = new UserProfileService();
  const evaluator = useApplicationStrengthEvaluator();
  const { pageError, pageErrorMessageKey, setPageError, clearPageError } = useErrorDisplay();

  const loading = ref(false);
  const forceHideInput = ref(false);
  const candidateFullName = ref('');

  const job = computed(() => jobAnalysis.selectedJob.value);
  const hasJob = computed(() => Boolean(job.value));
  const hasEvaluation = computed(() => Boolean(evaluator.evaluation.value));
  const showInput = computed(() => !hasEvaluation.value && !forceHideInput.value);

  const inputs = useApplicationStrengthInputs({ candidateFullName });

  const canEvaluate = computed(
    () => hasJob.value && inputs.canEvaluate.value && !evaluator.loading.value
  );

  async function resolveCandidateName() {
    try {
      if (!auth.userId.value) {
        await auth.loadUserId();
      }
      if (!auth.userId.value) {
        return;
      }
      const profile = await profileService.getFullUserProfile(auth.userId.value);
      candidateFullName.value = profile?.fullName?.trim() ?? '';
    } catch {
      candidateFullName.value = '';
    }
  }

  const evaluate = async () => {
    clearPageError();

    if (!job.value) {
      setPageError('', 'applicationStrength.errors.jobNotFound');
      return null;
    }

    if (!inputs.canEvaluate.value) {
      setPageError(
        '',
        inputs.validationErrors.value[0] ?? 'applicationStrength.errors.missingMaterial'
      );
      return null;
    }

    const input: EvaluateApplicationStrengthInput = {
      job: mapJobToOperationInput(job.value),
      cvText: inputs.cvText.value,
      coverLetterText: inputs.coverLetterText.value,
      language: locale.value || 'en',
    };

    try {
      const result = await evaluator.evaluate(input);
      forceHideInput.value = true;
      return result;
    } catch {
      forceHideInput.value = false;
      return null;
    }
  };

  const clear = () => {
    evaluator.reset();
    inputs.reset();
    forceHideInput.value = false;
    clearPageError();
  };

  const load = async () => {
    loading.value = true;
    clearPageError();

    try {
      await Promise.all([jobAnalysis.loadJobWithRelations(jobId), resolveCandidateName()]);
      if (!jobAnalysis.selectedJob.value) {
        setPageError('', 'applicationStrength.errors.jobNotFound');
      }
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Failed to load page.',
        'applicationStrength.errors.loadFailed'
      );
      logError('Failed to load application strength page', error, { jobId });
      captureEvent('application_strength_evaluation_failed', {
        error_code: 'page_load_failed',
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    pageError,
    pageErrorMessageKey,
    job,
    hasJob,
    canEvaluate,
    hasEvaluation,
    showInput,
    inputs,
    evaluator,
    load,
    evaluate,
    clear,
  };
}
