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
  const importCount = ref(0);

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

  function setImportCount(count: number) {
    importCount.value = count;
  }

  function reset() {
    currentStep.value = 'upload';
    errorMessage.value = null;
    uploadedFile.value = null;
    importCount.value = 0;
  }

  return {
    currentStep,
    errorMessage,
    uploadedFile,
    importCount,
    setStep,
    setError,
    clearError,
    setUploadedFile,
    setImportCount,
    reset,
  };
}
