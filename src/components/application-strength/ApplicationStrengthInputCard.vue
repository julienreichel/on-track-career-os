<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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
    extractionErrorMessageKey?: string | null;
    validationErrorKeys?: string[];
  }>(),
  {
    loading: false,
    isExtracting: false,
    extractionErrorMessageKey: null,
    validationErrorKeys: () => [],
  }
);
const { t } = useI18n();

const emit = defineEmits<{
  'update:pastedText': [value: string];
  uploadFile: [file: File | null | undefined];
  evaluate: [];
}>();

function handleFileChange(file: File | null | undefined) {
  emit('uploadFile', file ?? undefined);
}

const extractedTypeLabel = computed(() =>
  props.extractedType === 'cv'
    ? t('applicationStrength.input.detectedTypeCv')
    : t('applicationStrength.input.detectedTypeCoverLetter')
);

const pastedTypeLabel = computed(() =>
  props.pastedType === 'cv'
    ? t('applicationStrength.input.detectedTypeCv')
    : t('applicationStrength.input.detectedTypeCoverLetter')
);
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <div class="space-y-4">
        <UFileUpload
          v-if="!props.extractedText"
          :model-value="props.selectedFile"
          :label="t('applicationStrength.input.uploadLabel')"
          :description="t('applicationStrength.input.uploadDescription')"
          accept=".pdf,.txt"
          :clearable="false"
          :disabled="props.isExtracting"
          data-testid="application-strength-upload"
          @update:model-value="handleFileChange"
        />

        <div v-if="props.isExtracting" class="space-y-2">
          <USkeleton class="h-20 rounded-lg animate-pulse" />
          <USkeleton class="h-12 rounded-lg animate-pulse" />
          <p class="text-sm text-gray-500">{{ t('applicationStrength.input.extracting') }}</p>
        </div>

        <UAlert
          v-else-if="props.selectedFile"
          :title="t('applicationStrength.input.fileUploaded', { fileName: props.selectedFile.name })"
          color="primary"
        />

        <UAlert
          v-if="props.extractedType"
          color="neutral"
          variant="soft"
          :description="t('applicationStrength.input.detectedUploadedAs', { type: extractedTypeLabel })"
        />

        <details v-if="props.extractedText" class="rounded border border-default p-3">
          <summary class="cursor-pointer text-sm font-medium">
            {{ t('applicationStrength.input.extractedPreview') }}
          </summary>
          <p class="mt-2 whitespace-pre-wrap text-sm text-default">
            {{ props.extractedText }}
          </p>
        </details>
      </div>
    </UCard>

    <USeparator :label="t('applicationStrength.input.separator')" />

    <UCard>
      <UFormField
        :label="t('applicationStrength.input.pasteLabel')"
        :description="t('applicationStrength.input.pasteDescription')"
        class="w-full"
      >
        <UTextarea
          :model-value="props.pastedText"
          class="w-full"
          :rows="8"
          :placeholder="t('applicationStrength.input.pastePlaceholder')"
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
        :description="t('applicationStrength.input.detectedPastedAs', { type: pastedTypeLabel })"
      />

      <UAlert
        v-if="props.extractionErrorMessageKey"
        color="error"
        variant="soft"
        class="mt-4"
        :title="t('applicationStrength.input.fileExtractionError')"
        :description="t(props.extractionErrorMessageKey)"
      />

      <UAlert
        v-for="(errorKey, index) in props.validationErrorKeys"
        :key="`input-error-${index}`"
        color="warning"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        class="mt-4"
        :description="t(errorKey)"
      />

      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="primary"
            icon="i-heroicons-sparkles"
            :label="t('applicationStrength.input.evaluate')"
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
