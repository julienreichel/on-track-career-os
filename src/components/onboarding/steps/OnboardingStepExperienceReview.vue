<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CvExperiencesPreview from '@/components/cv/ExperiencesPreview.vue';
import StickyFooterCard from '@/components/common/StickyFooterCard.vue';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';

type Props = {
  experiences: ExtractedExperience[];
  isProcessing: boolean;
};

const props = defineProps<Props>();
const emit = defineEmits<{
  importExperiences: [];
  back: [];
  updateExperience: [index: number, value: ExtractedExperience];
}>();

const { t } = useI18n();

const experienceCount = computed(() => props.experiences.length);
</script>

<template>
  <div class="space-y-6 pb-24">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">{{ t('onboarding.steps.experienceReview.title') }}</h2>
      </template>
      <p class="text-sm text-dimmed">{{ t('onboarding.steps.experienceReview.hint') }}</p>
      <p class="mt-2 text-sm">
        {{ t('onboarding.steps.experienceReview.count', { count: experienceCount }) }}
      </p>
    </UCard>

    <CvExperiencesPreview
      :experiences="experiences"
      @update="(index, value) => emit('updateExperience', index, value)"
    />

    <StickyFooterCard>
      <UButton variant="ghost" color="neutral" :label="t('common.back')" @click="emit('back')" />
      <UButton
        color="primary"
        :label="t('onboarding.steps.experienceReview.import')"
        :loading="isProcessing"
        :disabled="isProcessing || experiences.length === 0"
        @click="emit('importExperiences')"
      />
    </StickyFooterCard>
  </div>
</template>
