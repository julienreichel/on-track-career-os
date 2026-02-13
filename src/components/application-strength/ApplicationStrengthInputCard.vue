<script setup lang="ts">
import { computed } from 'vue';
import type { CvSourceMode, CoverLetterSourceMode } from '@/composables/useApplicationStrengthInputs';

const props = withDefaults(
  defineProps<{
    cvSourceMode: CvSourceMode;
    coverLetterSourceMode: CoverLetterSourceMode;
    hasTailoredCv: boolean;
    hasTailoredCoverLetter: boolean;
    tailoredCvText: string;
    tailoredCoverLetterText: string;
    pastedCvText: string;
    pastedCoverLetterText: string;
    extractedCvText: string;
    extractedCoverLetterText: string;
    canEvaluate: boolean;
    loading?: boolean;
    isExtractingCv?: boolean;
    isExtractingCoverLetter?: boolean;
    validationErrors?: string[];
    extractionError?: string | null;
  }>(),
  {
    loading: false,
    isExtractingCv: false,
    isExtractingCoverLetter: false,
    validationErrors: () => [],
    extractionError: null,
  }
);

const emit = defineEmits<{
  'update:cvSourceMode': [value: CvSourceMode];
  'update:coverLetterSourceMode': [value: CoverLetterSourceMode];
  'update:pastedCvText': [value: string];
  'update:pastedCoverLetterText': [value: string];
  uploadCvFile: [file: File | null | undefined];
  uploadCoverLetterFile: [file: File | null | undefined];
  evaluate: [];
}>();

const cvTabItems = computed(() => {
  const items: Array<{ label: string; value: CvSourceMode; slot: CvSourceMode }> = [];
  if (props.hasTailoredCv) {
    items.push({ label: 'Tailored CV', value: 'tailoredCv', slot: 'tailoredCv' });
  }
  items.push({ label: 'Paste text', value: 'pastedText', slot: 'pastedText' });
  items.push({ label: 'Upload PDF/TXT', value: 'pdfUpload', slot: 'pdfUpload' });
  return items;
});

const coverLetterTabItems = computed(() => {
  const items: Array<{ label: string; value: CoverLetterSourceMode; slot: CoverLetterSourceMode }> = [];
  if (props.hasTailoredCoverLetter) {
    items.push({
      label: 'Tailored letter',
      value: 'tailoredCoverLetter',
      slot: 'tailoredCoverLetter',
    });
  }
  items.push({ label: 'Paste text', value: 'pastedText', slot: 'pastedText' });
  items.push({ label: 'Upload PDF/TXT', value: 'pdfUpload', slot: 'pdfUpload' });
  return items;
});

function parseSingleFile(file: unknown): File | null | undefined {
  if (Array.isArray(file)) {
    return file[0] as File | undefined;
  }
  return file as File | null | undefined;
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">Application materials</h3>
        <p class="text-sm text-dimmed">
          Evaluate this application with a tailored CV/letter, pasted text, or uploaded files.
        </p>
      </div>
    </template>

    <div class="space-y-8">
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-base font-medium">CV</h4>
          <span class="text-xs text-dimmed">Required</span>
        </div>

        <UTabs
          :model-value="props.cvSourceMode"
          :items="cvTabItems"
          @update:model-value="emit('update:cvSourceMode', $event as CvSourceMode)"
        >
          <template #tailoredCv>
            <details class="rounded border border-default p-3">
              <summary class="cursor-pointer text-sm font-medium">Tailored CV preview</summary>
              <p class="mt-2 whitespace-pre-wrap text-sm text-default">
                {{ props.tailoredCvText || 'No tailored CV available for this job.' }}
              </p>
            </details>
          </template>

          <template #pastedText>
            <UFormField label="Paste CV text">
              <UTextarea
                :model-value="props.pastedCvText"
                :rows="10"
                class="w-full"
                placeholder="Paste your CV text here..."
                data-testid="application-strength-cv-text"
                @update:model-value="emit('update:pastedCvText', ($event as string) || '')"
              />
              <p class="mt-1 text-xs text-dimmed">{{ props.pastedCvText.length }} chars</p>
            </UFormField>
          </template>

          <template #pdfUpload>
            <div class="space-y-3">
              <UFileUpload
                v-if="!props.extractedCvText"
                accept=".pdf,.txt"
                label="Upload CV file"
                description="PDF and TXT files are supported."
                data-testid="application-strength-cv-upload"
                @update:model-value="emit('uploadCvFile', parseSingleFile($event))"
              />

              <UAlert
                v-if="props.isExtractingCv"
                color="neutral"
                variant="soft"
                title="Extracting CV text..."
              />

              <details v-if="props.extractedCvText" class="rounded border border-default p-3">
                <summary class="cursor-pointer text-sm font-medium">Extracted CV text preview</summary>
                <p class="mt-2 whitespace-pre-wrap text-sm text-default">
                  {{ props.extractedCvText }}
                </p>
              </details>
            </div>
          </template>
        </UTabs>
      </section>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-base font-medium">Cover letter</h4>
          <span class="text-xs text-dimmed">Optional</span>
        </div>

        <UTabs
          :model-value="props.coverLetterSourceMode"
          :items="coverLetterTabItems"
          @update:model-value="emit('update:coverLetterSourceMode', $event as CoverLetterSourceMode)"
        >
          <template #tailoredCoverLetter>
            <details class="rounded border border-default p-3">
              <summary class="cursor-pointer text-sm font-medium">Tailored cover letter preview</summary>
              <p class="mt-2 whitespace-pre-wrap text-sm text-default">
                {{ props.tailoredCoverLetterText || 'No tailored cover letter available for this job.' }}
              </p>
            </details>
          </template>

          <template #pastedText>
            <UFormField label="Paste cover letter text">
              <UTextarea
                :model-value="props.pastedCoverLetterText"
                :rows="8"
                class="w-full"
                placeholder="Paste your cover letter text here..."
                data-testid="application-strength-cover-text"
                @update:model-value="emit('update:pastedCoverLetterText', ($event as string) || '')"
              />
              <p class="mt-1 text-xs text-dimmed">{{ props.pastedCoverLetterText.length }} chars</p>
            </UFormField>
          </template>

          <template #pdfUpload>
            <div class="space-y-3">
              <UFileUpload
                v-if="!props.extractedCoverLetterText"
                accept=".pdf,.txt"
                label="Upload cover letter file"
                description="PDF and TXT files are supported."
                data-testid="application-strength-cover-upload"
                @update:model-value="emit('uploadCoverLetterFile', parseSingleFile($event))"
              />

              <UAlert
                v-if="props.isExtractingCoverLetter"
                color="neutral"
                variant="soft"
                title="Extracting cover letter text..."
              />

              <details
                v-if="props.extractedCoverLetterText"
                class="rounded border border-default p-3"
              >
                <summary class="cursor-pointer text-sm font-medium">
                  Extracted cover letter text preview
                </summary>
                <p class="mt-2 whitespace-pre-wrap text-sm text-default">
                  {{ props.extractedCoverLetterText }}
                </p>
              </details>
            </div>
          </template>
        </UTabs>
      </section>

      <UAlert
        v-if="props.extractionError"
        color="error"
        variant="soft"
        title="File extraction error"
        :description="props.extractionError"
      />

      <UAlert
        v-for="(error, index) in props.validationErrors"
        :key="`input-error-${index}`"
        color="warning"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :description="error"
      />
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          color="primary"
          icon="i-heroicons-sparkles"
          label="Evaluate"
          data-testid="application-strength-evaluate"
          :loading="props.loading"
          :disabled="!props.canEvaluate || props.loading"
          @click="emit('evaluate')"
        />
      </div>
    </template>
  </UCard>
</template>
