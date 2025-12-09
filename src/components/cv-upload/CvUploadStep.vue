<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  fileSelected: [file: File];
}>();

const selectedFile = ref<File | null>(null);

function handleFileChange(files: File[]) {
  if (files.length > 0) {
    selectedFile.value = files[0];
    emit('fileSelected', files[0]);
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">
        {{ t('profile.cvUpload.title') }}
      </h2>
    </template>

    <div class="space-y-4">
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('profile.cvUpload.description') }}
      </p>

      <UFileUpload
        :model-value="selectedFile ? [selectedFile] : []"
        accept=".pdf,.txt"
        @update:model-value="handleFileChange"
      />

      <UAlert
        v-if="selectedFile"
        :title="t('profile.cvUpload.fileSelected')"
        :description="selectedFile.name"
        color="primary"
      />
    </div>
  </UCard>
</template>
