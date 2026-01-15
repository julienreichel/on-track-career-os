<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import CvExperiencesPreview from '@/components/cv/ExperiencesPreview.vue';
import CvProfilePreview from '@/components/cv/ProfilePreview.vue';
import type { ExtractedExperience } from '@/domain/ai-operations/Experience';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

type Props = {
  experiences: ExtractedExperience[];
  profile: ParseCvTextOutput['profile'] | null;
  isProcessing: boolean;
};

const props = defineProps<Props>();
const emit = defineEmits<{
  importExperiences: [];
  back: [];
}>();

const { t } = useI18n();
const router = useRouter();

const MIN_EXPERIENCE_COUNT = 3;
const experienceCount = computed(() => props.experiences.length);
const hasEnoughExperiences = computed(() => experienceCount.value >= MIN_EXPERIENCE_COUNT);

const handleAddManual = () => {
  void router.push('/profile/experiences/new');
};
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">{{ t('onboarding.steps.experienceReview.title') }}</h2>
      </template>
      <p class="text-sm text-dimmed">{{ t('onboarding.steps.experienceReview.hint') }}</p>
      <p class="mt-2 text-sm">
        {{ t('onboarding.steps.experienceReview.count', { count: experienceCount }) }}
      </p>
      <UAlert
        v-if="!hasEnoughExperiences"
        class="mt-4"
        icon="i-heroicons-information-circle"
        color="warning"
        variant="soft"
        :title="t('onboarding.steps.experienceReview.needsMore')"
      >
        <template #description>
          <span>{{ t('onboarding.steps.experienceReview.needsMoreHint') }}</span>
        </template>
      </UAlert>
    </UCard>

    <CvExperiencesPreview :experiences="experiences" />

    <CvProfilePreview v-if="profile" :profile="profile" />

    <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <UButton
        variant="ghost"
        color="neutral"
        :label="t('common.back')"
        @click="emit('back')"
      />
      <div class="flex flex-col gap-2 sm:flex-row">
        <UButton
          v-if="!hasEnoughExperiences"
          variant="outline"
          color="neutral"
          :label="t('onboarding.steps.experienceReview.addManual')"
          @click="handleAddManual"
        />
        <UButton
          color="primary"
          :label="t('onboarding.steps.experienceReview.import')"
          :loading="isProcessing"
          :disabled="isProcessing || experiences.length === 0"
          @click="emit('importExperiences')"
        />
      </div>
    </div>
  </div>
</template>
