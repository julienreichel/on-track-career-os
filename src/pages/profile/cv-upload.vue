<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAiOperations } from '@/application/ai-operations/useAiOperations';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';
import { PDFParse } from 'pdf-parse';

// Configure PDF.js worker (must be set before any PDF operations)
PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

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
async function handleUpload(file: File | null | undefined) {
  if (!file) return;

  uploadedFile.value = file;
  currentStep.value = 'parsing';
  errorMessage.value = null;

  try {
    let text: string;

    // Check file type and parse accordingly
    if (file.type === 'application/pdf') {
      // Parse PDF file using pdf-parse
      const arrayBuffer = await file.arrayBuffer();
      const parser = new PDFParse({ data: arrayBuffer });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
    } else {
      // Read text file (txt, doc, docx - for now just txt)
      const reader = new FileReader();
      text = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    }

    if (!text || text.trim().length === 0) {
      throw new Error(t('cvUpload.errors.noTextExtracted'));
    }

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

// Remove an experience from the list
function removeExperience(index: number) {
  extractedExperiences.value.splice(index, 1);
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
        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('cvUpload.errors.unknown')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="errorMessage = null"
        />

        <!-- Upload Step -->
        <UCard v-if="currentStep === 'upload'">
          <UFileUpload
            v-model="uploadedFile"
            accept=".pdf,.doc,.docx,.txt"
            :label="t('cvUpload.dropzone.label')"
            :description="t('cvUpload.dropzone.description')"
            icon="i-heroicons-document-text"
            @update:model-value="handleUpload"
          />
        </UCard>

        <!-- Parsing Step -->
        <UCard v-if="currentStep === 'parsing'">
          <UEmpty
            icon="i-heroicons-arrow-path"
            :title="t('cvUpload.parsing')"
            :description="t('cvUpload.parsingDescription')"
          />
          <UProgress animation="carousel" />
        </UCard>

        <!-- Preview Step -->
        <UCard v-if="currentStep === 'preview'">
          <template #header>
            <UPageHeader
              :title="t('cvUpload.parsedTitle')"
              :description="t('cvUpload.parsedDescription')"
            />
          </template>

          <UPageGrid v-if="extractedExperiences.length > 0">
            <UCard v-for="(exp, index) in extractedExperiences" :key="index" class="lg:col-span-3">
              <template #header>
                <UPageHeader
                  :title="exp.title"
                  :description="exp.company"
                  :links="[
                    {
                      label: t('cvUpload.removeExperience'),
                      icon: 'i-heroicons-trash',
                      color: 'error',
                      onClick: () => removeExperience(index),
                    },
                  ]"
                />
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ exp.startDate }} - {{ exp.endDate || t('experiences.present') }}
                </UBadge>
              </template>

              <template v-if="exp.responsibilities.length > 0">
                <p class="font-semibold mb-2">{{ t('experiences.form.responsibilities') }}:</p>
                <ul class="list-disc list-inside space-y-1 mb-4">
                  <li v-for="(resp, idx) in exp.responsibilities.slice(0, exp.responsibilities.length > 3 ? 2 : exp.responsibilities.length)" :key="idx">
                    {{ resp }}
                  </li>
                  <li v-if="exp.responsibilities.length > 3">
                    <UBadge color="neutral" variant="subtle">
                      +{{ exp.responsibilities.length - 2 }} {{ t('cvUpload.more') }}
                    </UBadge>
                  </li>
                </ul>
              </template>

              <template v-if="exp.tasks.length > 0">
                <p class="font-semibold mb-2">{{ t('experiences.form.tasks') }}:</p>
                <ul class="list-disc list-inside space-y-1">
                  <li v-for="(task, idx) in exp.tasks.slice(0, exp.tasks.length > 3 ? 2 : exp.tasks.length)" :key="idx">
                    {{ task }}
                  </li>
                  <li v-if="exp.tasks.length > 3">
                    <UBadge color="neutral" variant="subtle">
                      +{{ exp.tasks.length - 2 }} {{ t('cvUpload.more') }}
                    </UBadge>
                  </li>
                </ul>
              </template>
            </UCard>
          </UPageGrid>

          <template #footer>
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
          </template>
        </UCard>

        <!-- Importing Step -->
        <UCard v-if="currentStep === 'importing'">
          <UEmpty icon="i-heroicons-arrow-path" :title="t('cvUpload.importing')" />
          <UProgress animation="carousel" />
        </UCard>

        <!-- Complete Step -->
        <UCard v-if="currentStep === 'complete'">
          <UEmpty
            icon="i-heroicons-check-circle"
            :title="t('cvUpload.success', { count: importCount })"
            color="success"
          >
            <template #actions>
              <UButton
                :label="t('cvUpload.viewExperiences')"
                icon="i-heroicons-arrow-right"
                @click="viewExperiences"
              />
            </template>
          </UEmpty>
        </UCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
