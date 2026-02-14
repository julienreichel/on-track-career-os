<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    selectedFile: File | null;
    pastedText: string;
    extractedText: string;
    extractedType: 'cv' | 'coverLetter' | null;
    pastedType: 'cv' | 'coverLetter' | null;
    canEvaluate: boolean;
    loading?: boolean;
    isExtracting?: boolean;
    extractionError?: string | null;
    validationErrors?: string[];
  }>(),
  {
    loading: false,
    isExtracting: false,
    extractionError: null,
    validationErrors: () => [],
  }
);

const emit = defineEmits<{
  'update:pastedText': [value: string];
  uploadFile: [file: File | null | undefined];
  evaluate: [];
}>();

function handleFileChange(file: File | null | undefined) {
  emit('uploadFile', file ?? undefined);
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <div class="space-y-4">
        <UFileUpload
          v-if="!props.extractedText"
          :model-value="props.selectedFile"
          label="Upload application document"
          description="Upload one CV or cover letter file (PDF or TXT)."
          accept=".pdf,.txt"
          :clearable="false"
          :disabled="props.isExtracting"
          data-testid="application-strength-upload"
          @update:model-value="handleFileChange"
        />

        <div v-if="props.isExtracting" class="space-y-2">
          <USkeleton class="h-20 rounded-lg animate-pulse" />
          <USkeleton class="h-12 rounded-lg animate-pulse" />
          <p class="text-sm text-gray-500">Extracting text from uploaded file...</p>
        </div>

        <UAlert
          v-else-if="props.selectedFile"
          :title="`File uploaded: ${props.selectedFile.name}`"
          color="primary"
        />

        <UAlert
          v-if="props.extractedType"
          color="neutral"
          variant="soft"
          :description="`Detected uploaded file as ${props.extractedType === 'cv' ? 'CV' : 'cover letter'}.`"
        />

        <details v-if="props.extractedText" class="rounded border border-default p-3">
          <summary class="cursor-pointer text-sm font-medium">Extracted text preview</summary>
          <p class="mt-2 whitespace-pre-wrap text-sm text-default">
            {{ props.extractedText }}
          </p>
        </details>
      </div>
    </UCard>

    <USeparator label="Or paste application text" />

    <UCard>
      <UFormField
        label="Paste application text"
        description="Paste either CV content or cover letter text. Type is detected automatically."
        class="w-full"
      >
        <UTextarea
          :model-value="props.pastedText"
          class="w-full"
          :rows="8"
          placeholder="Paste CV or cover letter here..."
          data-testid="application-strength-paste-text"
          :disabled="props.loading || props.isExtracting"
          @update:model-value="emit('update:pastedText', ($event as string) || '')"
        />
      </UFormField>

      <UAlert
        v-if="props.pastedType"
        color="neutral"
        variant="soft"
        class="mt-4"
        :description="`Detected pasted text as ${props.pastedType === 'cv' ? 'CV' : 'cover letter'}.`"
      />

      <UAlert
        v-if="props.extractionError"
        color="error"
        variant="soft"
        class="mt-4"
        title="File extraction error"
        :description="props.extractionError"
      />

      <UAlert
        v-for="(error, index) in props.validationErrors"
        :key="`input-error-${index}`"
        color="warning"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        class="mt-4"
        :description="error"
      />

      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="primary"
            icon="i-heroicons-sparkles"
            label="Evaluate"
            data-testid="application-strength-evaluate"
            :loading="props.loading"
            :disabled="!props.canEvaluate || props.loading || props.isExtracting"
            @click="emit('evaluate')"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
