<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

const { t } = useI18n();
const router = useRouter();
const aiOps = useAiOperations();
const experienceRepo = new ExperienceRepository();

// Workflow state
type WorkflowStep = 'upload' | 'parsing' | 'preview' | 'importing' | 'complete';
const currentStep = ref<WorkflowStep>('upload');

// Data state
const extractedText = ref<string>('');
const extractedExperiences = ref<ExtractedExperience[]>([]);
const errorMessage = ref<string | null>(null);
const importCount = ref(0);
const uploadedFile = ref<File | null>(null);

// Handle file upload
async function handleUpload(file: File | null) {
  if (!file) return;

  uploadedFile.value = file;
  currentStep.value = 'parsing';
  errorMessage.value = null;

  try {
    // Read file content
    const reader = new FileReader();
    const text = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });

    extractedText.value = text;
    // Step 1: Parse CV text to extract sections
    await aiOps.parseCv(text);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (!aiOps.parsedCv.value?.sections?.experiences) {
      throw new Error(t('cvUpload.errors.parsingFailed'));
    }

    // Step 2: Extract experience blocks from parsed sections
    await aiOps.extractExperiences(aiOps.parsedCv.value.sections.experiences);

    if (aiOps.error.value) {
      throw new Error(aiOps.error.value);
    }

    if (!aiOps.experiences.value?.experiences) {
      throw new Error(t('cvUpload.errors.extractionFailed'));
    }

    extractedExperiences.value = aiOps.experiences.value.experiences;
    currentStep.value = 'preview';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('cvUpload.errors.unknown');
    currentStep.value = 'upload';
    uploadedFile.value = null;
  }
}

// Handle import confirmation
async function handleImport() {
  currentStep.value = 'importing';
  errorMessage.value = null;

  try {
    // Get current user ID from Amplify
    const user = useNuxtApp().$Amplify.Auth.getCurrentUser();
    const userId = (await user).userId;

    // Create Experience entities in database
    const createPromises = extractedExperiences.value.map((exp) =>
      experienceRepo.create({
        title: exp.title,
        companyName: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate || undefined,
        responsibilities: exp.responsibilities,
        tasks: exp.tasks,
        rawText: extractedText.value,
        status: 'draft',
        userId,
      })
    );

    const results = await Promise.all(createPromises);
    importCount.value = results.filter((r) => r !== null).length;

    currentStep.value = 'complete';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('cvUpload.errors.importFailed');
    currentStep.value = 'preview';
  }
}

// Handle cancel
function handleCancel() {
  currentStep.value = 'upload';
  extractedText.value = '';
  extractedExperiences.value = [];
  errorMessage.value = null;
  uploadedFile.value = null;
  aiOps.reset();
}

// Navigate to experiences list
function viewExperiences() {
  router.push('/profile/experiences');
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="t('cvUpload.title')" :description="t('cvUpload.description')" />

      <UPageBody>
        <div class="space-y-6">
          <!-- Error Alert -->
          <UAlert
            v-if="errorMessage"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="t('cvUpload.errors.unknown')"
            :description="errorMessage"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
            @close="errorMessage = null"
          />

          <!-- Upload Step -->
          <div v-if="currentStep === 'upload'">
            <UFileUpload
              v-model="uploadedFile"
              accept=".pdf,.doc,.docx,.txt"
              :label="t('cvUpload.dropzone.label')"
              :description="t('cvUpload.dropzone.description')"
              icon="i-heroicons-document-text"
              class="min-h-48"
              @update:model-value="handleUpload"
            />
          </div>

          <!-- Parsing Step -->
          <UCard v-if="currentStep === 'parsing'">
            <div class="flex flex-col items-center gap-4 py-8">
              <UIcon name="i-heroicons-arrow-path" class="h-12 w-12 animate-spin text-primary" />
              <div class="text-center">
                <h3 class="text-lg font-semibold">{{ t('cvUpload.parsing') }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t('cvUpload.parsingDescription') }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Preview Step -->
          <div v-if="currentStep === 'preview'" class="space-y-4">
            <UCard>
              <template #header>
                <div class="space-y-2">
                  <h3 class="text-lg font-semibold">{{ t('cvUpload.parsedTitle') }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('cvUpload.parsedDescription') }}
                  </p>
                </div>
              </template>

              <div class="space-y-4">
                <div v-if="extractedExperiences.length > 0">
                  <h4 class="mb-3 font-medium">
                    {{ t('cvUpload.sections.experiences') }} ({{ extractedExperiences.length }})
                  </h4>
                  <div class="space-y-3">
                    <UCard v-for="(exp, index) in extractedExperiences" :key="index">
                      <div class="space-y-2">
                        <h5 class="font-semibold">{{ exp.title }}</h5>
                        <p class="text-sm text-gray-600">{{ exp.company }}</p>
                        <p class="text-xs text-gray-500">
                          {{ exp.startDate }} - {{ exp.endDate || t('experiences.present') }}
                        </p>
                        <div v-if="exp.responsibilities.length > 0" class="text-sm">
                          <p class="font-medium">{{ t('experiences.form.responsibilities') }}:</p>
                          <ul class="ml-4 list-disc">
                            <li v-for="(resp, idx) in exp.responsibilities.slice(0, 3)" :key="idx">
                              {{ resp }}
                            </li>
                            <li v-if="exp.responsibilities.length > 3" class="text-gray-500">
                              +{{ exp.responsibilities.length - 3 }} more...
                            </li>
                          </ul>
                        </div>
                      </div>
                    </UCard>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex justify-end gap-3">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    :label="t('cvUpload.cancel')"
                    @click="handleCancel"
                  />
                  <UButton
                    :label="t('cvUpload.confirmImport')"
                    icon="i-heroicons-arrow-down-tray"
                    @click="handleImport"
                  />
                </div>
              </template>
            </UCard>
          </div>

          <!-- Importing Step -->
          <UCard v-if="currentStep === 'importing'">
            <div class="flex flex-col items-center gap-4 py-8">
              <UIcon name="i-heroicons-arrow-path" class="h-12 w-12 animate-spin text-primary" />
              <div class="text-center">
                <h3 class="text-lg font-semibold">{{ t('cvUpload.importing') }}</h3>
              </div>
            </div>
          </UCard>

          <!-- Complete Step -->
          <UCard v-if="currentStep === 'complete'">
            <div class="flex flex-col items-center gap-4 py-8">
              <UIcon name="i-heroicons-check-circle" class="h-12 w-12 text-green-500" />
              <div class="text-center">
                <h3 class="text-lg font-semibold">
                  {{ t('cvUpload.success', { count: importCount }) }}
                </h3>
              </div>
              <UButton
                :label="t('cvUpload.viewExperiences')"
                icon="i-heroicons-arrow-right"
                @click="viewExperiences"
              />
            </div>
          </UCard>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
