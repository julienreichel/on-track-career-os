import { ref } from 'vue';

export type WorkflowStep = 'upload' | 'parsing' | 'preview' | 'importing' | 'complete';

/**
 * Composable for managing CV upload workflow state
 * Handles step transitions, error messages, and file state
 */
export function useCvUploadWorkflow() {
  const currentStep = ref<WorkflowStep>('upload');
  const errorMessage = ref<string | null>(null);
  const uploadedFile = ref<File | null>(null);
  const importSummary = ref({ createdCount: 0, updatedCount: 0 });

  function setStep(step: WorkflowStep) {
    currentStep.value = step;
    errorMessage.value = null;
  }

  function setError(message: string) {
    errorMessage.value = message;
  }

  function clearError() {
    errorMessage.value = null;
  }

  function setUploadedFile(file: File | null) {
    uploadedFile.value = file;
  }

  function setImportSummary(createdCount: number, updatedCount: number) {
    importSummary.value = { createdCount, updatedCount };
  }

  function reset() {
    currentStep.value = 'upload';
    errorMessage.value = null;
    uploadedFile.value = null;
    importSummary.value = { createdCount: 0, updatedCount: 0 };
  }

  return {
    currentStep,
    errorMessage,
    uploadedFile,
    importSummary,
    setStep,
    setError,
    clearError,
    setUploadedFile,
    setImportSummary,
    reset,
  };
}
