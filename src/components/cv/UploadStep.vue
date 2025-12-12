<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  fileSelected: [file: File];
}>();

const selectedFile = ref<File | null>(null);

function handleFileChange(file: File | null | undefined) {
  if (file) {
    selectedFile.value = file;
    emit('fileSelected', file);
  }
}
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <UFileUpload
        :model-value="selectedFile"
        :label="t('cvUpload.dropzoneText')"
        :description="t('cvUpload.dropzoneHint')"
        accept=".pdf,.txt"
        @update:model-value="handleFileChange"
      />

      <UAlert
        v-if="selectedFile"
        :title="t('cvUpload.fileUploaded', { fileName: selectedFile.name })"
        color="primary"
      />
    </div>
  </UCard>
</template>
