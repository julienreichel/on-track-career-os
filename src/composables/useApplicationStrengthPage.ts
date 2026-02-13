import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { useApplicationStrengthInputs } from '@/composables/useApplicationStrengthInputs';
import { useApplicationStrengthEvaluator } from '@/composables/useApplicationStrengthEvaluator';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import type { EvaluateApplicationStrengthInput } from '@/domain/ai-operations/ApplicationStrengthResult';

type JobOperationInput = EvaluateApplicationStrengthInput['job'];

type JobWithRelations = JobDescription & {
  cvs?: Array<CVDocument | null> | null;
  coverLetters?: Array<CoverLetter | null> | null;
};

type DatedItem = {
  content?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  generatedAt?: string | null;
};

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

function pickMostRecentContent<T extends DatedItem>(items: Array<T | null> | null | undefined): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  const validItems = items.filter((item): item is T => Boolean(item));
  if (!validItems.length) {
    return '';
  }

  const mostRecent =
    [...validItems].sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.generatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.generatedAt ?? b.createdAt ?? 0).getTime();
      return dateB - dateA;
    })[0] ?? null;

  return mostRecent?.content?.trim() ?? '';
}

export function useApplicationStrengthPage(jobId: string) {
  const { locale } = useI18n();
  const jobAnalysis = useJobAnalysis();
  const evaluator = useApplicationStrengthEvaluator();

  const loading = ref(false);
  const pageError = ref<string | null>(null);
  const forceHideInput = ref(false);

  const job = computed(() => jobAnalysis.selectedJob.value as JobWithRelations | null);
  const hasJob = computed(() => Boolean(job.value));

  const tailoredCvText = computed(() => pickMostRecentContent(job.value?.cvs));
  const tailoredCoverLetterText = computed(() => pickMostRecentContent(job.value?.coverLetters));

  const inputs = useApplicationStrengthInputs({
    tailoredCvText,
    tailoredCoverLetterText,
  });

  const hasEvaluation = computed(() => Boolean(evaluator.evaluation.value));
  const showInput = computed(() => !hasEvaluation.value && !forceHideInput.value);

  watch(
    [tailoredCvText, tailoredCoverLetterText],
    () => {
      inputs.ensureSupportedModes();
    },
    { immediate: true }
  );

  const canEvaluate = computed(
    () => hasJob.value && inputs.canEvaluate.value && !evaluator.loading.value
  );

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
      await jobAnalysis.loadJobWithRelations(jobId);
      inputs.ensureSupportedModes();
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
