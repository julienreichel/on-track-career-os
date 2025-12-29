<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { PDFParse } from 'pdf-parse';
import { useJobAnalysis } from '@/composables/useJobAnalysis';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs'
);

const MIN_TEXT_LENGTH = 400;

const router = useRouter();
const jobAnalysis = useJobAnalysis();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const extractedText = ref('');
const errorMessage = ref<string | null>(null);
const extracting = ref(false);
const analyzing = ref(false);

const isBusy = computed(() => extracting.value || analyzing.value);
const charactersCount = computed(() => extractedText.value.trim().length);
const meetsMinimumLength = computed(() => charactersCount.value >= MIN_TEXT_LENGTH);
const canAnalyze = computed(() => !isBusy.value && meetsMinimumLength.value);

function triggerFileDialog() {
  fileInputRef.value?.click();
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: arrayBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) ?? '');
    reader.onerror = (event) => reject(event);
    reader.readAsText(file);
  });
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  errorMessage.value = null;
  selectedFile.value = file;
  extracting.value = true;
  extractedText.value = '';

  try {
    const text =
      file.type === 'application/pdf'
        ? await extractPdfText(file)
        : await extractTextFromFile(file);

    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from this file. Please try another document.');
    }

    extractedText.value = text.trim();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to process this file. Please try again.';
  } finally {
    extracting.value = false;
    input.value = '';
  }
}

async function analyzeJob() {
  if (!meetsMinimumLength.value || !extractedText.value) {
    errorMessage.value =
      'Please provide a job description with enough content before analyzing (min 400 characters).';
    return;
  }

  errorMessage.value = null;
  analyzing.value = true;

  try {
    const draft = await jobAnalysis.createJobFromRawText(extractedText.value);
    const analyzed = await jobAnalysis.reanalyseJob(draft.id);
    router.push(`/jobs/${analyzed.id}`);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Something went wrong while analyzing the job.';
  } finally {
    analyzing.value = false;
  }
}

function resetForm() {
  selectedFile.value = null;
  extractedText.value = '';
  errorMessage.value = null;
  extracting.value = false;
  analyzing.value = false;
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        title="Analyze a new job"
        description="Upload a job description and let AI structure the role automatically."
      >
        <template #actions>
          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            label="Back to jobs"
            @click="router.push('/jobs')"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="errorMessage"
          color="error"
          icon="i-lucide-alert-triangle"
          title="Unable to process job description"
          :description="errorMessage"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
          class="mb-6"
          @close="errorMessage = null"
        />

        <UCard>
          <div class="space-y-6">
            <section>
              <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                Upload job description
              </h2>
              <p class="mt-1 text-sm text-gray-500">
                Upload a PDF or paste the job description below. We’ll extract the content and run
                job analysis automatically.
              </p>

              <UCard class="mt-4" variant="soft">
                <div class="flex flex-col items-center gap-3 text-center">
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept=".pdf,.txt"
                    class="hidden"
                    @change="handleFileChange"
                  />
                  <UButton
                    icon="i-heroicons-arrow-up-on-square-stack"
                    :label="selectedFile ? 'Replace file' : 'Select job description PDF'"
                    variant="outline"
                    :disabled="isBusy"
                    @click="triggerFileDialog"
                  />
                  <p v-if="selectedFile" class="text-sm text-gray-600 dark:text-gray-300">
                    Uploaded: <span class="font-medium">{{ selectedFile.name }}</span>
                  </p>
                </div>
              </UCard>
            </section>

            <section>
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Extracted job description
                </label>
                <span class="text-xs text-gray-500"
                  >{{ charactersCount }} / {{ MIN_TEXT_LENGTH }} characters</span
                >
              </div>

              <USkeleton v-if="extracting" class="mt-3 h-32 rounded-lg" />

              <UTextarea
                v-else
                v-model="extractedText"
                :rows="14"
                placeholder="Paste or edit the job description..."
                :disabled="isBusy"
                class="w-full"
              />

              <p v-if="!meetsMinimumLength && extractedText" class="mt-2 text-sm text-gray-500">
                Add at least {{ MIN_TEXT_LENGTH }} characters so the AI has enough context.
              </p>
            </section>

            <section class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <UButton variant="ghost" :disabled="isBusy" @click="resetForm">Clear</UButton>
              <UButton
                color="primary"
                :label="analyzing ? 'Analyzing…' : 'Analyze job'"
                icon="i-lucide-sparkles"
                :loading="analyzing"
                :disabled="!canAnalyze"
                @click="analyzeJob"
              />
            </section>
          </div>
        </UCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
