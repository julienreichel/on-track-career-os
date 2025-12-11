<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEditor } from '@/composables/useStoryEditor';
import { useStarInterview } from '@/composables/useStarInterview';
import { useStoryEnhancer } from '@/composables/useStoryEnhancer';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { Experience } from '@/domain/experience/Experience';
import type { STARStory } from '@/domain/starstory/STARStory';

defineOptions({
  name: 'StoryFormPage',
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const experienceId = computed(() => route.params.experienceId as string);
const storyId = computed(() => route.params.storyId as string);
const companyName = ref<string>('');

// Determine if we're creating or editing
const isNew = computed(() => storyId.value === 'new');

// Update breadcrumb label dynamically
watch(
  isNew,
  (newValue) => {
    route.meta.breadcrumbLabel = newValue ? 'New' : 'Edit';
  },
  { immediate: true }
);

const experienceService = new ExperienceService();

// Use new composables
const {
  story,
  formState,
  isDirty,
  canSave,
  loading: editorLoading,
  saving,
  error: editorError,
  load,
  initializeNew,
  save,
  updateField,
} = useStoryEditor();

const {
  chatHistory,
  currentStep,
  allStepsCompleted,
  generatedStory,
  generating: interviewGenerating,
  error: interviewError,
  initialize,
  submitAnswer,
  nextStep,
  generateStory,
} = useStarInterview();

const {
  achievements,
  kpiSuggestions,
  isGenerating: enhancerGenerating,
  error: enhancerError,
  generateFromStory,
  addAchievement,
  removeAchievement,
  updateAchievement,
  addKpi,
  removeKpi,
  updateKpi,
} = useStoryEnhancer();

// UI state
const showModeSelection = ref(true);
const selectedMode = ref<'interview' | 'manual' | null>(null);
const showInterviewChat = ref(false);
const showAchievementsPanel = ref(false);

// Computed states
const loading = computed(() => editorLoading.value || interviewGenerating.value);
const error = computed(() => editorError.value || interviewError.value || enhancerError.value);

/**
 * Format experience data as text for AI generation
 */
const formatExperienceAsText = (experience: Experience): string => {
  const lines = [];

  lines.push(`Job Title: ${experience.title}`);

  if (experience.companyName) {
    lines.push(`Company: ${experience.companyName}`);
  }

  const startDate = experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '';
  const endDate = experience.endDate
    ? new Date(experience.endDate).toLocaleDateString()
    : 'Present';
  lines.push(`Duration: ${startDate} - ${endDate}`);
  lines.push('');

  if (experience.responsibilities && experience.responsibilities.length > 0) {
    lines.push('Responsibilities:');
    experience.responsibilities.forEach((resp) => lines.push(`- ${resp}`));
    lines.push('');
  }

  if (experience.tasks && experience.tasks.length > 0) {
    lines.push('Tasks & Achievements:');
    experience.tasks.forEach((task) => lines.push(`- ${task}`));
  }

  return lines.join('\n');
};

// Handle starting interview mode
const handleStartInterview = async () => {
  selectedMode.value = 'interview';
  showModeSelection.value = false;
  showInterviewChat.value = true;

  try {
    const experience = await experienceService.getFullExperience(experienceId.value);
    if (experience) {
      const formattedText = formatExperienceAsText(experience);
      // Create new interview composable with source text
      const interviewWithContext = useStarInterview(formattedText);
      // Copy refs to use in template
      Object.assign(
        { chatHistory, currentStep, allStepsCompleted, generatedStory },
        {
          chatHistory: interviewWithContext.chatHistory,
          currentStep: interviewWithContext.currentStep,
          allStepsCompleted: interviewWithContext.allStepsCompleted,
          generatedStory: interviewWithContext.generatedStory,
        }
      );
      interviewWithContext.initialize();
    } else {
      // No experience context, just initialize
      initialize();
    }
  } catch (err) {
    console.error('[StoryForm] Interview start error:', err);
  }
};

// Handle manual mode selection
const handleSelectManual = () => {
  selectedMode.value = 'manual';
  showModeSelection.value = false;
};

// Handle interview answer submission
const handleAnswerSubmit = async (answer: string) => {
  if (submitAnswer(answer)) {
    if (!nextStep()) {
      // Last step completed, generate story
      const story = await generateStory();
      if (story) {
        // Populate form state with generated story
        updateField('situation', story.situation);
        updateField('task', story.task);
        updateField('action', story.action);
        updateField('result', story.result);
      }
    }
  }
};

// Handle interview completion
watch(allStepsCompleted, async (complete) => {
  if (complete && generatedStory.value) {
    showInterviewChat.value = false;
    selectedMode.value = 'manual'; // Switch to manual mode to show form
    // Generate achievements automatically
    await handleGenerateAchievements();
  }
});

// Handle achievements generation
const handleGenerateAchievements = async () => {
  if (!formState.value) return;

  showAchievementsPanel.value = true;
  // Create a story object from form state for generation
  const storyForGeneration = {
    situation: formState.value.situation,
    task: formState.value.task,
    action: formState.value.action,
    result: formState.value.result,
  } as STARStory;
  
  await generateFromStory(storyForGeneration);

  // Update story with generated achievements
  if (achievements.value.length > 0) {
    updateField('achievements', achievements.value);
  }
  if (kpiSuggestions.value.length > 0) {
    updateField('kpiSuggestions', kpiSuggestions.value);
  }
};

// Handle story form updates
const handleStoryUpdate = (field: keyof STARStory, value: unknown) => {
  updateField(field, value);
};

// Handle save
const handleSave = async () => {
  try {
    const savedStory = await save(experienceId.value);
    if (savedStory) {
      router.push(`/profile/experiences/${experienceId.value}/stories`);
    }
  } catch (err) {
    console.error('[StoryForm] Save error:', err);
  }
};

// Handle cancel
const handleCancel = () => {
  if (isDirty.value) {
    if (!confirm(t('stories.editor.unsavedChanges'))) {
      return;
    }
  }
  router.push(`/profile/experiences/${experienceId.value}/stories`);
};

// Load experience and story (if editing) on mount
onMounted(async () => {
  // Load experience company name for display
  try {
    const experience = await experienceService.getFullExperience(experienceId.value);
    if (experience) {
      companyName.value = experience.companyName || experience.title;
    }
  } catch (err) {
    console.error('[StoryForm] Error loading experience:', err);
  }

  // If editing, load the story
  if (!isNew.value && storyId.value) {
    await load(storyId.value);
    // Load existing achievements into enhancer
    if (story.value?.achievements) {
      story.value.achievements.forEach((ach) => addAchievement(ach));
    }
    if (story.value?.kpiSuggestions) {
      story.value.kpiSuggestions.forEach((kpi) => addKpi(kpi));
    }
  } else if (isNew.value) {
    // Initialize new story with empty form state
    initializeNew({ experienceId: experienceId.value });
  }
});
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="isNew ? t('stories.builder.newTitle') : t('stories.builder.editTitle')"
        :description="companyName"
        :links="[
          {
            label: t('stories.builder.backToStories'),
            to: `/profile/experiences/${experienceId}/stories`,
            icon: 'i-heroicons-arrow-left',
          },
        ]"
      />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="error"
          color="red"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="error"
          class="mb-6"
        />

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('stories.builder.loading') }}
            </p>
          </div>
        </div>

        <!-- Saving State -->
        <div v-else-if="saving" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('stories.builder.saving') }}
            </p>
          </div>
        </div>

        <!-- Mode Selection (only for new stories) -->
        <UCard v-else-if="isNew && showModeSelection && !selectedMode" class="mb-6">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">
                {{ t('stories.builder.chooseMode') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('stories.builder.chooseModeDescription') }}
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <!-- Interview Mode -->
              <UCard
                class="cursor-pointer hover:border-primary-500 transition-colors"
                @click="handleStartInterview"
              >
                <div class="flex flex-col items-center text-center gap-3 p-4">
                  <UIcon name="i-heroicons-chat-bubble-left-right" class="w-8 h-8 text-primary" />
                  <h4 class="font-medium">{{ t('stories.builder.modeInterview') }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('stories.builder.modeInterviewDescription') }}
                  </p>
                </div>
              </UCard>

              <!-- Manual Entry -->
              <UCard
                class="cursor-pointer hover:border-primary-500 transition-colors"
                @click="handleSelectManual"
              >
                <div class="flex flex-col items-center text-center gap-3 p-4">
                  <UIcon name="i-heroicons-pencil-square" class="w-8 h-8 text-primary" />
                  <h4 class="font-medium">{{ t('stories.builder.modeManual') }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('stories.builder.modeManualDescription') }}
                  </p>
                </div>
              </UCard>
            </div>
          </div>
        </UCard>

        <!-- Interview Chat -->
        <UCard v-else-if="showInterviewChat && !allStepsCompleted" class="mb-6">
          <StarInterviewChat
            :messages="chatHistory"
            :current-question="currentStep?.question || ''"
            :is-generating="interviewGenerating"
            @answer="handleAnswerSubmit"
          />
        </UCard>

        <!-- Story Form (for manual mode or editing or after interview) -->
        <div v-else-if="(selectedMode === 'manual' || !isNew) && formState" class="space-y-6">
          <UCard>
            <StoryForm
              :model-value="formState"
              @update:situation="(val) => handleStoryUpdate('situation', val)"
              @update:task="(val) => handleStoryUpdate('task', val)"
              @update:action="(val) => handleStoryUpdate('action', val)"
              @update:result="(val) => handleStoryUpdate('result', val)"
            />
          </UCard>

          <!-- Achievements & KPIs Panel -->
          <UCard v-if="showAchievementsPanel || !isNew">
            <div class="mb-4 flex justify-between items-center">
              <h3 class="text-lg font-semibold">
                {{ t('stories.editor.achievementsAndKpis') }}
              </h3>
              <UButton
                v-if="!enhancerGenerating"
                :label="t('stories.editor.generateAchievements')"
                icon="i-heroicons-sparkles"
                variant="soft"
                size="sm"
                @click="handleGenerateAchievements"
              />
            </div>

            <AchievementsKpisPanel
              :achievements="achievements"
              :kpi-suggestions="kpiSuggestions"
              :is-generating="enhancerGenerating"
              @add-achievement="addAchievement"
              @remove-achievement="removeAchievement"
              @update-achievement="updateAchievement"
              @add-kpi="addKpi"
              @remove-kpi="removeKpi"
              @update-kpi="updateKpi"
            />
          </UCard>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="handleCancel" />
            <UButton
              :label="t('common.save')"
              icon="i-heroicons-check"
              :disabled="!canSave || saving"
              :loading="saving"
              @click="handleSave"
            />
          </div>
        </div>

        <!-- Not Found (editing non-existent story) -->
        <UAlert
          v-else-if="!isNew && !formState && !loading"
          color="yellow"
          icon="i-heroicons-exclamation-triangle"
          :title="t('stories.builder.notFound')"
          :description="t('stories.builder.notFoundDescription')"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
