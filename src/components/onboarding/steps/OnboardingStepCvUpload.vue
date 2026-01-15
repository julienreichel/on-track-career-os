<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import CvUploadStep from '@/components/cv/UploadStep.vue';
import CvParsingStep from '@/components/cv/ParsingStep.vue';

type Props = {
  isProcessing: boolean;
};

defineProps<Props>();

const emit = defineEmits<{
  fileSelected: [file: File];
}>();

const { t } = useI18n();

const handleFileSelected = (file: File) => {
  emit('fileSelected', file);
};
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">{{ t('onboarding.steps.cvUpload.title') }}</h2>
      </template>
      <p class="text-sm text-dimmed">{{ t('onboarding.steps.cvUpload.hint') }}</p>
    </UCard>

    <CvUploadStep @file-selected="handleFileSelected" />

    <CvParsingStep v-if="isProcessing" />
  </div>
</template>
