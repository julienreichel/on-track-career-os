<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  selectedFile: File | null;
  isProcessing: boolean;
  statusMessage: string | null;
}>();

const emit = defineEmits<{
  fileSelected: [file: File | null | undefined];
}>();

const { t } = useI18n();

const showStatus = computed(() => props.isProcessing && props.statusMessage);

function handleFileChange(file: File | null | undefined) {
  emit('fileSelected', file ?? undefined);
}
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <UFileUpload
        :model-value="selectedFile"
        :label="t('companies.upload.dropzone.label')"
        :description="t('companies.upload.dropzone.description')"
        accept=".pdf,.txt"
        :clearable="false"
        :disabled="isProcessing"
        @update:model-value="handleFileChange"
      />

      <div v-if="showStatus" class="space-y-2">
        <USkeleton class="h-20 w-full rounded-lg animate-pulse" />
        <USkeleton class="h-12 w-full rounded-lg animate-pulse" />
        <p class="text-sm text-gray-500">{{ statusMessage }}</p>
      </div>

      <UAlert
        v-else-if="selectedFile"
        color="primary"
        :title="t('companies.upload.fileUploaded', { fileName: selectedFile.name })"
      />
    </div>
  </UCard>
</template>
