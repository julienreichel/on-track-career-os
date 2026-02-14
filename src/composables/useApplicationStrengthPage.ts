import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useAuthUser } from '@/composables/useAuthUser';
import { useApplicationStrengthInputs } from '@/composables/useApplicationStrengthInputs';
import { useApplicationStrengthEvaluator } from '@/composables/useApplicationStrengthEvaluator';
import { UserProfileService } from '@/domain/user-profile/UserProfileService';
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

export function useApplicationStrengthPage(jobId: string) {
  const { locale } = useI18n();
  const jobAnalysis = useJobAnalysis();
  const auth = useAuthUser();
  const profileService = new UserProfileService();
  const evaluator = useApplicationStrengthEvaluator();

  const loading = ref(false);
  const pageError = ref<string | null>(null);
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
    pageError.value = null;

    if (!job.value) {
      pageError.value = 'Job not found.';
      return null;
    }

    if (!inputs.canEvaluate.value) {
      pageError.value = inputs.validationErrors.value[0] ?? 'Please provide CV text.';
      return null;
    }

    const input: EvaluateApplicationStrengthInput = {
      job: mapJobToOperationInput(job.value),
      cvText: inputs.cvText.value,
      coverLetterText: inputs.coverLetterText.value,
      language: locale.value || 'en',
    };

    const result = await evaluator.evaluate(input);
    forceHideInput.value = true;
    return result;
  };

  const clear = () => {
    evaluator.reset();
    inputs.reset();
    forceHideInput.value = false;
    pageError.value = null;
  };

  const load = async () => {
    loading.value = true;
    pageError.value = null;

    try {
      await Promise.all([jobAnalysis.loadJobWithRelations(jobId), resolveCandidateName()]);
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : 'Failed to load page.';
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    pageError,
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
