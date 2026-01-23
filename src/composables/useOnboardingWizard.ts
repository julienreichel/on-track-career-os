import { computed, ref } from 'vue';
import { useAuthUser } from '@/composables/useAuthUser';
import { useUserProgress } from '@/composables/useUserProgress';
import { useCvParsing } from '@/composables/useCvParsing';
import { useExperienceImport } from '@/composables/useExperienceImport';
import { useProfileMerge } from '@/composables/useProfileMerge';
import {
  onboardingSteps,
  clampOnboardingStep,
  getOnboardingStepIndex,
  getRequiredOnboardingStep,
} from '@/domain/onboarding';
import type { OnboardingStepId } from '@/domain/onboarding';

const STORAGE_PREFIX = 'onboarding-step';

function buildStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function createStepPersistence(
  auth: ReturnType<typeof useAuthUser>,
  currentStep: { value: OnboardingStepId }
) {
  const persistStep = () => {
    if (!auth.userId.value) return;
    if (!import.meta.client) return;
    localStorage.setItem(buildStorageKey(auth.userId.value), currentStep.value);
  };

  const readPersistedStep = (): OnboardingStepId | null => {
    if (!auth.userId.value || !import.meta.client) {
      return null;
    }
    const stored = localStorage.getItem(buildStorageKey(auth.userId.value));
    if (!stored) return null;
    return onboardingSteps.some((step) => step.id === stored) ? (stored as OnboardingStepId) : null;
  };

  return { persistStep, readPersistedStep };
}

function createStepNavigation(
  currentStep: { value: OnboardingStepId },
  stepIndex: { value: number },
  persistStep: () => void
) {
  const goToStep = (stepId: OnboardingStepId) => {
    currentStep.value = stepId;
    persistStep();
  };

  const next = () => {
    const nextIndex = Math.min(stepIndex.value + 1, onboardingSteps.length - 1);
    currentStep.value = onboardingSteps[nextIndex]?.id ?? currentStep.value;
    persistStep();
  };

  const back = () => {
    const previousIndex = Math.max(stepIndex.value - 1, 0);
    currentStep.value = onboardingSteps[previousIndex]?.id ?? currentStep.value;
    persistStep();
  };

  const skip = () => {
    next();
  };

  return { goToStep, next, back, skip };
}

type ActionDependencies = {
  auth: ReturnType<typeof useAuthUser>;
  progress: ReturnType<typeof useUserProgress>;
  parsing: ReturnType<typeof useCvParsing>;
  importer: ReturnType<typeof useExperienceImport>;
  profileMerge: ReturnType<typeof useProfileMerge>;
  currentStep: { value: OnboardingStepId };
  readPersistedStep: () => OnboardingStepId | null;
  goToStep: (stepId: OnboardingStepId) => void;
  next: () => void;
  setError: (value: string | null) => void;
  setProcessing: (value: boolean) => void;
  setSelectedFile: (value: File | null) => void;
};

function createOnboardingActions(deps: ActionDependencies) {
  const load = async () => {
    deps.setError(null);
    await deps.progress.load();

    if (!deps.progress.state.value) {
      return;
    }

    const required = getRequiredOnboardingStep(deps.progress.state.value);
    const saved = deps.readPersistedStep();
    const desired = saved ?? required;
    deps.currentStep.value = clampOnboardingStep(desired, required);
  };

  const handleCvFile = async (file: File) => {
    deps.setProcessing(true);
    deps.setError(null);
    deps.setSelectedFile(file);

    try {
      await deps.parsing.parseFile(file);
      deps.goToStep('experience-review');
    } catch {
      deps.setError('onboarding.errors.parseFailed');
    } finally {
      deps.setProcessing(false);
    }
  };

  const importExperiences = async () => {
    if (!deps.auth.userId.value) {
      await deps.auth.loadUserId();
    }
    if (!deps.auth.userId.value) {
      deps.setError('onboarding.errors.missingUser');
      return;
    }

    deps.setProcessing(true);
    deps.setError(null);

    try {
      await deps.importer.importExperiences(
        deps.parsing.extractedExperiences.value,
        deps.parsing.extractedText.value,
        deps.auth.userId.value
      );

      if (deps.parsing.extractedProfile.value) {
        await deps.profileMerge.mergeProfile(
          deps.auth.userId.value,
          deps.parsing.extractedProfile.value,
          deps.parsing.aiOps.parsedCv.value
        );
      }

      await deps.progress.refresh();
      deps.next();
    } catch {
      deps.setError('onboarding.errors.importFailed');
    } finally {
      deps.setProcessing(false);
    }
  };

  const finish = async () => {
    await deps.progress.refresh();
    deps.goToStep('complete');
  };

  return {
    load,
    handleCvFile,
    importExperiences,
    finish,
  };
}

export function useOnboardingWizard() {
  const auth = useAuthUser();
  const progress = useUserProgress();
  const parsing = useCvParsing();
  const importer = useExperienceImport();
  const profileMerge = useProfileMerge();

  const currentStep = ref<OnboardingStepId>('cv-upload');
  const isProcessing = ref(false);
  const error = ref<string | null>(null);
  const selectedFile = ref<File | null>(null);

  const steps = computed(() => onboardingSteps);
  const stepIndex = computed(() => getOnboardingStepIndex(currentStep.value));
  const canProceed = computed(
    () => currentStep.value !== 'cv-upload' || Boolean(selectedFile.value)
  );

  const { persistStep, readPersistedStep } = createStepPersistence(auth, currentStep);
  const { goToStep, next, back, skip } = createStepNavigation(currentStep, stepIndex, persistStep);

  const { load, handleCvFile, importExperiences, finish } = createOnboardingActions({
    auth,
    progress,
    parsing,
    importer,
    profileMerge,
    currentStep,
    readPersistedStep,
    goToStep,
    next,
    setError: (value) => {
      error.value = value;
    },
    setProcessing: (value) => {
      isProcessing.value = value;
    },
    setSelectedFile: (value) => {
      selectedFile.value = value;
    },
  });

  return {
    steps,
    currentStep,
    stepIndex,
    canProceed,
    isProcessing,
    error,
    parsing,
    progress,
    load,
    goToStep,
    next,
    back,
    skip,
    handleCvFile,
    importExperiences,
    finish,
  };
}
