<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEditor } from '@/composables/useStoryEditor';
import { useStarInterview } from '@/composables/useStarInterview';
import { useStoryEnhancer } from '@/composables/useStoryEnhancer';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
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

const { generating: interviewGenerating, error: interviewError } = useStarInterview();

const {
  achievements,
  kpiSuggestions,
  generating: enhancerGenerating,
  error: enhancerError,
  generate: generateEnhancements,
  load: loadEnhancements,
} = useStoryEnhancer();

// UI state
const showModeSelection = ref(true);
const selectedMode = ref<'interview' | 'manual' | null>(null);
const showAchievementsPanel = ref(false);
const freeTextInput = ref('');
const showCancelConfirm = ref(false);

// Computed states
const loading = computed(() => editorLoading.value || interviewGenerating.value);
const error = computed(() => editorError.value || interviewError.value || enhancerError.value);

// Handle starting free text mode
const handleStartInterview = () => {
  selectedMode.value = 'interview';
  showModeSelection.value = false;
};

// Handle manual mode selection
const handleSelectManual = () => {
  selectedMode.value = 'manual';
  showModeSelection.value = false;
};

// Handle free text submission
const handleSubmitFreeText = async () => {
  if (!freeTextInput.value.trim()) return;

  try {
    const storyService = new STARStoryService();
    const aiStories = await storyService.generateStar(freeTextInput.value);

    if (aiStories && aiStories.length > 0) {
      const story = aiStories[0];
      // Populate form state with generated story
      updateField('situation', story.situation);
      updateField('task', story.task);
      updateField('action', story.action);
      updateField('result', story.result);

      // Switch to manual mode to show the form
      selectedMode.value = 'manual';

      // Generate achievements automatically
      await handleGenerateAchievements();
    }
  } catch (err) {
    console.error('[StoryForm] Free text generation error:', err);
  }
};

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

  await generateEnhancements(storyForGeneration);

  // Update story with generated achievements
  if (achievements.value.length > 0) {
    updateField('achievements', achievements.value);
  }
  if (kpiSuggestions.value.length > 0) {
    updateField('kpiSuggestions', kpiSuggestions.value);
  }
}; // Handle story form updates
const handleStoryUpdate = (field: keyof STARStory, value: unknown) => {
  updateField(field, value);
};

// Handle achievements update from component
const handleAchievementsUpdate = (newAchievements: string[]) => {
  achievements.value = newAchievements;
  updateField('achievements', newAchievements);
};

// Handle KPIs update from component
const handleKpisUpdate = (newKpis: string[]) => {
  kpiSuggestions.value = newKpis;
  updateField('kpiSuggestions', newKpis);
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
    showCancelConfirm.value = true;
    return;
  }
  router.push(`/profile/experiences/${experienceId.value}/stories`);
};

// Handle confirm cancel
const handleConfirmCancel = () => {
  showCancelConfirm.value = false;
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
    if (formState.value) {
      loadEnhancements({
        achievements: formState.value.achievements || [],
        kpiSuggestions: formState.value.kpiSuggestions || [],
      });
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

        <!-- Free Text Input -->
        <UCard v-else-if="isNew && selectedMode === 'interview'" class="mb-6">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">
                {{ t('stories.builder.modeFreetext') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('stories.builder.freetextInstructions') }}
              </p>
            </div>

            <UFormField :label="t('stories.builder.freetextLabel')" required>
              <UTextarea
                v-model="freeTextInput"
                :placeholder="t('stories.builder.freetextPlaceholder')"
                :rows="10"
                :disabled="interviewGenerating"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3">
              <UButton :label="t('common.cancel')" variant="ghost" @click="handleCancel" />
              <UButton
                :label="t('stories.builder.generateFromText')"
                icon="i-heroicons-sparkles"
                :disabled="!freeTextInput.trim() || interviewGenerating"
                :loading="interviewGenerating"
                @click="handleSubmitFreeText"
              />
            </div>
          </div>
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
            <AchievementsKpisPanel
              :achievements="achievements"
              :kpis="kpiSuggestions"
              :generating="enhancerGenerating"
              @update:achievements="handleAchievementsUpdate"
              @update:kpis="handleKpisUpdate"
              @regenerate="handleGenerateAchievements"
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

    <!-- Cancel Confirmation Modal -->
    <UModal v-model="showCancelConfirm">
      <UCard
        :ui="{
          header: { padding: 'px-4 py-4 sm:px-6' },
          body: { padding: 'px-4 py-5 sm:p-6' },
          footer: { padding: 'px-4 py-4 sm:px-6' },
        }"
      >
        <template #header>
          {{
            isDirty ? t('stories.editor.unsavedChanges') : t('stories.editor.cancelCreation')
          }}
        </template>

        {{
          isDirty
            ? t('stories.editor.unsavedChangesDescription')
            : t('stories.editor.cancelCreationDescription')
        }}

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              :label="isDirty ? t('common.cancel') : t('common.no')"
              variant="ghost"
              @click="showCancelConfirm = false"
            />
            <UButton
              :label="isDirty ? t('common.confirm') : t('common.yes')"
              color="red"
              @click="handleConfirmCancel"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>
