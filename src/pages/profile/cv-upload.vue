<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useCvUploadWorkflow } from '@/composables/useCvUploadWorkflow';
import { useCvParsing } from '@/composables/useCvParsing';
import { useExperienceImport } from '@/composables/useExperienceImport';
import StickyFooterCard from '@/components/common/StickyFooterCard.vue';

const { t } = useI18n();
const router = useRouter();

// Composables
const workflow = useCvUploadWorkflow();
const parsing = useCvParsing();
const importing = useExperienceImport();
const NON_CV_BACKEND_MESSAGE =
  'Unable to parse this document as a CV. Please upload a CV or resume.';

const errorTitle = computed(() => {
  const message = workflow.errorMessage.value;
  if (!message) return '';
  if (message === t('ingestion.cv.upload.errors.notCvDescription')) {
    return t('ingestion.cv.upload.errors.notCvTitle');
  }
  if (message === t('ingestion.cv.upload.errors.importFailed')) {
    return t('ingestion.cv.upload.errors.importFailed');
  }
  if (message === t('ingestion.cv.upload.errors.extractionFailed')) {
    return t('ingestion.cv.upload.errors.extractionFailed');
  }
  if (message === t('ingestion.cv.upload.errors.parsingFailed')) {
    return t('ingestion.cv.upload.errors.parsingFailedTitle');
  }
  if (message === t('ingestion.cv.upload.errors.noTextExtracted')) {
    return t('ingestion.cv.upload.errors.noTextExtracted');
  }
  return t('ingestion.cv.upload.errors.unknown');
});

// Handle file selection and parsing
async function handleFileSelected(file: File) {
  workflow.setUploadedFile(file);
  workflow.setStep('parsing');

  try {
    await parsing.parseFile(file);
    workflow.setStep('preview');
  } catch (error) {
    workflow.reset();
    const fallbackMessage = t('ingestion.cv.upload.errors.unknown');
    let message = error instanceof Error ? error.message : fallbackMessage;
    if (message === NON_CV_BACKEND_MESSAGE) {
      message = t('ingestion.cv.upload.errors.notCvDescription');
    }
    workflow.setError(message);
  }
}

// Handle import confirmation
async function handleImport() {
  workflow.setStep('importing');

  try {
    // Get current user ID
    const user = useNuxtApp().$Amplify.Auth.getCurrentUser();
    const userId = (await user).userId;

    // Import experiences
    const { createdCount, updatedCount } = await importing.importExperiences(
      parsing.extractedExperiences.value,
      parsing.extractedText.value,
      userId
    );
    workflow.setImportSummary(createdCount, updatedCount);

    workflow.setStep('complete');
  } catch (error) {
    workflow.setError(
      error instanceof Error ? error.message : t('ingestion.cv.upload.errors.importFailed')
    );
    workflow.setStep('preview');
  }
}

// Navigation handlers
function handleCancel() {
  workflow.reset();
  parsing.reset();
}

function viewExperiences() {
  void router.push('/profile/experiences');
}
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('ingestion.cv.upload.title')"
      :description="t('ingestion.cv.upload.description')"
    >
      <template #actions>
        <UButton
          v-if="workflow.currentStep.value === 'upload'"
          icon="i-heroicons-arrow-left"
          variant="ghost"
          :label="t('common.backToProfile')"
          @click="router.push('/profile')"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- Error Alert -->
    <UAlert
      v-if="workflow.errorMessage.value"
      icon="i-lucide-alert-triangle"
      color="error"
      :title="errorTitle"
      :description="workflow.errorMessage.value"
      :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
      @close="workflow.clearError()"
    />

      <!-- Upload Step -->
      <CvUploadStep
        v-if="workflow.currentStep.value === 'upload'"
        @file-selected="handleFileSelected"
      />

      <!-- Parsing Step -->
      <CvParsingStep v-if="workflow.currentStep.value === 'parsing'" />

      <!-- Preview Step -->
      <div v-if="workflow.currentStep.value === 'preview'" class="space-y-6 pb-24">
        <!-- Experiences Preview -->
        <CvExperiencesPreview
          :experiences="parsing.extractedExperiences.value"
          @remove="parsing.removeExperience"
          @update="parsing.updateExperience"
        />

        <!-- Actions -->
        <StickyFooterCard>
          <UButton :label="t('common.actions.cancel')" variant="ghost" @click="handleCancel" />
          <UButton :label="t('ingestion.cv.upload.confirmImport')" @click="handleImport" />
        </StickyFooterCard>
      </div>

      <!-- Importing Step -->
      <CvParsingStep v-if="workflow.currentStep.value === 'importing'" />

      <!-- Complete Step -->
      <CvImportSuccess
        v-if="workflow.currentStep.value === 'complete'"
        :created-count="workflow.importSummary.value.createdCount"
        :updated-count="workflow.importSummary.value.updatedCount"
        @view-experiences="viewExperiences"
      />
    </UPageBody>
  </UPage>
</template>
