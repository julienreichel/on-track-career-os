<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStarInterview } from '@/composables/useStarInterview';
import { useStoryEditor } from '@/composables/useStoryEditor';
import { useStoryEnhancer } from '@/composables/useStoryEnhancer';

const router = useRouter();
const { t } = useI18n();

// Get experience ID from query params (optional)
const route = useRoute();
const experienceId = computed(() => route.query.experienceId as string | undefined);

// Composables
const {
  chatHistory,
  currentStep,
  generating,
  error: interviewError,
  allStepsCompleted,
  progress,
  initialize,
  submitAnswer,
  nextStep,
  generateStory,
} = useStarInterview();

const { initializeNew, formState, save, saving } = useStoryEditor();
const {
  achievements,
  kpiSuggestions,
  generating: enhancing,
  generate: generateEnhancements,
} = useStoryEnhancer();

// UI State
const currentAnswer = ref('');
const step = ref<'interview' | 'review' | 'enhance'>('interview');
const showEnhancements = ref(false);

onMounted(() => {
  initialize();
});

const handleSubmitAnswer = async () => {
  if (!currentAnswer.value.trim()) return;

  const success = submitAnswer(currentAnswer.value);
  if (success) {
    currentAnswer.value = '';
    if (allStepsCompleted.value) {
      // Generate story and move to review
      const story = await generateStory();
      if (story) {
        initializeNew({
          situation: story.situation,
          task: story.task,
          action: story.action,
          result: story.result,
          experienceId: experienceId.value,
        });
        step.value = 'review';
      }
    } else {
      nextStep();
    }
  }
};

const handleGenerateEnhancements = async () => {
  if (!formState.value) return;
  await generateEnhancements(formState.value);
  showEnhancements.value = true;
};

const handleSaveStory = async () => {
  // Add achievements and KPIs to form state
  formState.value.achievements = achievements.value;
  formState.value.kpiSuggestions = kpiSuggestions.value;

  const saved = await save(experienceId.value);
  if (saved) {
    router.push(`/stories/${saved.id}`);
  }
};

const handleBackToInterview = () => {
  step.value = 'interview';
};
</script>

<template>
  <UContainer>
    <UPageHeader
      :title="t('stories.builder.newTitle')"
      :description="t('stories.builder.newDescription')"
    >
      <template #actions>
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-left"
          :label="t('navigation.backToHome')"
          to="/stories"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- Progress Bar -->
      <div v-if="step === 'interview'" class="mb-6">
        <UProgress :value="progress" />
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ t('common.step', 'Step') }} {{ currentStep?.key }}
        </div>
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="interviewError"
        color="red"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="interviewError"
        class="mb-6"
      />

      <!-- Interview Step -->
      <div v-if="step === 'interview'" class="space-y-6">
        <StarInterviewChat
          :messages="chatHistory"
          :current-question="currentStep?.question"
          :loading="generating"
          @submit="submitAnswer"
        />

        <div class="flex items-center gap-2">
          <UTextarea
            v-model="currentAnswer"
            :placeholder="t('interview.answerPlaceholder')"
            :rows="4"
            :disabled="generating"
            class="flex-1"
            @keyup.enter.ctrl="handleSubmitAnswer"
          />
          <UButton
            icon="i-heroicons-arrow-right"
            :disabled="!currentAnswer.trim() || generating"
            :loading="generating"
            @click="handleSubmitAnswer"
          />
        </div>
      </div>

      <!-- Review & Edit Step -->
      <div v-if="step === 'review'" class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">{{ t('stories.builder.editTitle') }}</h3>
              <UButton
                variant="ghost"
                icon="i-heroicons-arrow-left"
                size="sm"
                @click="handleBackToInterview"
              />
            </div>
          </template>

          <StoryForm v-model="formState" :disabled="saving" />
        </UCard>

        <!-- Achievements Section -->
        <UCard v-if="showEnhancements">
          <AchievementsKpisPanel
            v-model:achievements="achievements"
            v-model:kpis="kpiSuggestions"
            :generating="enhancing"
            @regenerate="handleGenerateEnhancements"
          />
        </UCard>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <UButton
            v-if="!showEnhancements"
            variant="outline"
            :label="t('enhancer.title')"
            icon="i-heroicons-sparkles"
            :loading="enhancing"
            @click="handleGenerateEnhancements"
          />
          <div v-else />
          <div class="flex gap-2">
            <UButton variant="ghost" :label="t('common.cancel')" @click="router.push('/stories')" />
            <UButton
              :label="t('common.save')"
              icon="i-heroicons-check"
              :loading="saving"
              :disabled="saving"
              @click="handleSaveStory"
            />
          </div>
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
