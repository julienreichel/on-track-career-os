import { describe, it, expect } from 'vitest';
import { useCvUploadWorkflow } from '@/composables/useCvUploadWorkflow';
import type { WorkflowStep } from '@/composables/useCvUploadWorkflow';

describe('useCvUploadWorkflow', () => {
  it('should initialize with default values', () => {
    const workflow = useCvUploadWorkflow();

    expect(workflow.currentStep.value).toBe('upload');
    expect(workflow.errorMessage.value).toBeNull();
    expect(workflow.uploadedFile.value).toBeNull();
    expect(workflow.importCount.value).toBe(0);
  });

  describe('setStep', () => {
    it('should update current step', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setStep('parsing');
      expect(workflow.currentStep.value).toBe('parsing');

      workflow.setStep('preview');
      expect(workflow.currentStep.value).toBe('preview');
    });

    it('should clear error message when setting new step', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setError('Test error');
      expect(workflow.errorMessage.value).toBe('Test error');

      workflow.setStep('parsing');
      expect(workflow.errorMessage.value).toBeNull();
    });

    it('should handle all workflow steps', () => {
      const workflow = useCvUploadWorkflow();
      const steps: WorkflowStep[] = ['upload', 'parsing', 'preview', 'importing', 'complete'];

      steps.forEach((step) => {
        workflow.setStep(step);
        expect(workflow.currentStep.value).toBe(step);
      });
    });
  });

  describe('error handling', () => {
    it('should set error message', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setError('Something went wrong');
      expect(workflow.errorMessage.value).toBe('Something went wrong');
    });

    it('should clear error message', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setError('Error');
      expect(workflow.errorMessage.value).toBe('Error');

      workflow.clearError();
      expect(workflow.errorMessage.value).toBeNull();
    });

    it('should allow multiple error updates', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setError('First error');
      expect(workflow.errorMessage.value).toBe('First error');

      workflow.setError('Second error');
      expect(workflow.errorMessage.value).toBe('Second error');
    });
  });

  describe('file management', () => {
    it('should set uploaded file', () => {
      const workflow = useCvUploadWorkflow();
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      workflow.setUploadedFile(mockFile);
      expect(workflow.uploadedFile.value).toBe(mockFile);
    });

    it('should clear uploaded file', () => {
      const workflow = useCvUploadWorkflow();
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      workflow.setUploadedFile(mockFile);
      expect(workflow.uploadedFile.value).toBe(mockFile);

      workflow.setUploadedFile(null);
      expect(workflow.uploadedFile.value).toBeNull();
    });
  });

  describe('import count', () => {
    it('should set import count', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setImportCount(5);
      expect(workflow.importCount.value).toBe(5);
    });

    it('should update import count', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setImportCount(3);
      expect(workflow.importCount.value).toBe(3);

      workflow.setImportCount(7);
      expect(workflow.importCount.value).toBe(7);
    });

    it('should handle zero import count', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setImportCount(5);
      workflow.setImportCount(0);
      expect(workflow.importCount.value).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all state to defaults', () => {
      const workflow = useCvUploadWorkflow();
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      // Set various states
      workflow.setStep('complete');
      workflow.setError('Error message');
      workflow.setUploadedFile(mockFile);
      workflow.setImportCount(10);

      // Reset
      workflow.reset();

      expect(workflow.currentStep.value).toBe('upload');
      expect(workflow.errorMessage.value).toBeNull();
      expect(workflow.uploadedFile.value).toBeNull();
      expect(workflow.importCount.value).toBe(0);
    });

    it('should allow reusing workflow after reset', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setStep('complete');
      workflow.reset();

      workflow.setStep('parsing');
      expect(workflow.currentStep.value).toBe('parsing');
    });
  });

  describe('workflow transitions', () => {
    it('should support typical workflow progression', () => {
      const workflow = useCvUploadWorkflow();
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      // Upload
      expect(workflow.currentStep.value).toBe('upload');
      workflow.setUploadedFile(mockFile);

      // Parsing
      workflow.setStep('parsing');
      expect(workflow.currentStep.value).toBe('parsing');

      // Preview
      workflow.setStep('preview');
      expect(workflow.currentStep.value).toBe('preview');

      // Importing
      workflow.setStep('importing');
      expect(workflow.currentStep.value).toBe('importing');

      // Complete
      workflow.setImportCount(5);
      workflow.setStep('complete');
      expect(workflow.currentStep.value).toBe('complete');
      expect(workflow.importCount.value).toBe(5);
    });

    it('should handle error during workflow', () => {
      const workflow = useCvUploadWorkflow();

      workflow.setStep('parsing');
      workflow.setError('Failed to parse CV');

      expect(workflow.currentStep.value).toBe('parsing');
      expect(workflow.errorMessage.value).toBe('Failed to parse CV');

      // Reset and retry
      workflow.reset();
      expect(workflow.currentStep.value).toBe('upload');
      expect(workflow.errorMessage.value).toBeNull();
    });
  });
});
