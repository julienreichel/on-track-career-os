<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useCvUploadWorkflow } from '@/composables/useCvUploadWorkflow';
import { useCvParsing } from '@/composables/useCvParsing';
import { useExperienceImport } from '@/composables/useExperienceImport';

const { t } = useI18n();
const router = useRouter();

// Composables
const workflow = useCvUploadWorkflow();
const parsing = useCvParsing();
const importing = useExperienceImport();

// Handle file selection and parsing
async function handleFileSelected(file: File) {
  workflow.setUploadedFile(file);
  workflow.setStep('parsing');

  try {
    await parsing.parseFile(file);
    workflow.setStep('preview');
  } catch (error) {
    workflow.setError(error instanceof Error ? error.message : t('cvUpload.errors.unknown'));
    workflow.reset();
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
    workflow.setError(error instanceof Error ? error.message : t('cvUpload.errors.importFailed'));
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
  <UContainer>
    <UPage>
      <UPageHeader :title="t('cvUpload.title')" :description="t('cvUpload.description')">
        <template #actions>
          <UButton
            v-if="workflow.currentStep.value === 'upload'"
            icon="i-heroicons-arrow-left"
            variant="ghost"
            :label="t('navigation.backToProfile')"
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
          :title="t('cvUpload.errors.unknown')"
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
          <UCard class="sticky bottom-0 z-10">
            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton :label="t('common.cancel')" variant="ghost" @click="handleCancel" />
                <UButton
                  :label="t('cvUpload.confirmImport')"
                  icon="i-lucide-download"
                  @click="handleImport"
                />
              </div>
            </template>
          </UCard>
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
  </UContainer>
</template>
