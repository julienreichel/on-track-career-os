<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import StoryBuilder from '@/components/StoryBuilder.vue';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';
import type { Experience } from '@/domain/experience/Experience';

defineOptions({
  name: 'NewStoryPage',
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const experienceId = computed(() => route.params.experienceId as string);

const {
  generating,
  saving,
  error,
  runStarInterview,
  generateAchievements,
  saveStory,
  updateDraft,
} = useStoryEngine(experienceId);

const generatedAchievements = ref<AchievementsAndKpis | null>(null);
const showModeSelection = ref(true);
const selectedMode = ref<'experience' | 'freetext' | 'manual' | null>(null);
const freeTextInput = ref('');

// Services
const experienceService = new ExperienceService();

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

// Handle generation from experience data
const handleGenerateFromExperience = async () => {
  try {
    const experience = await experienceService.getFullExperience(experienceId.value);
    if (!experience) {
      throw new Error('Experience not found');
    }

    const formattedText = formatExperienceAsText(experience);
    await handleGenerateFromText(formattedText);
  } catch (err) {
    console.error('[NewStory] Generate from experience error:', err);
  }
};

// Handle AI generation from free text
const handleGenerateFromText = async (freeText: string) => {
  try {
    const result = await runStarInterview(freeText);
    if (result) {
      // Draft is automatically updated by runStarInterview
      showModeSelection.value = false;
      selectedMode.value = null;
    }
  } catch (err) {
    console.error('[NewStory] Generation error:', err);
  }
};

// Handle submitting free text for generation
const handleSubmitFreeText = async () => {
  if (!freeTextInput.value.trim()) return;
  await handleGenerateFromText(freeTextInput.value);
};

// Handle achievements generation
const handleGenerateAchievements = async () => {
  try {
    const result = await generateAchievements();
    if (result) {
      generatedAchievements.value = result;
    }
  } catch (err) {
    console.error('[NewStory] Achievements generation error:', err);
  }
};

interface StoryData {
  situation: string;
  task: string;
  action: string;
  result: string;
  achievements: string[];
  kpiSuggestions: string[];
}

// Handle save
const handleSave = async (storyData: StoryData) => {
  try {
    // Update draft with form data
    updateDraft(storyData);

    // Save the draft
    const saved = await saveStory(experienceId.value);
    if (saved) {
      router.push(`/profile/experiences/${experienceId.value}/stories`);
    }
  } catch (err) {
    console.error('[NewStory] Save error:', err);
  }
};

// Handle cancel
const handleCancel = () => {
  router.push(`/profile/experiences/${experienceId.value}/stories`);
};
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('stories.builder.newTitle')"
        :description="t('stories.builder.newDescription')"
        :links="[
          {
            label: t('stories.builder.backToStories'),
            to: `/profile/experiences/${experienceId}/stories`,
            icon: 'i-heroicons-arrow-left',
          },
        ]"
      />

      <UPageBody>
        <UAlert
          v-if="error"
          color="red"
          icon="i-heroicons-exclamation-circle"
          :title="t('common.error')"
          :description="error"
        />

        <div v-if="generating" class="flex items-center justify-center py-12">
          <div class="text-center">
            <USkeleton class="h-8 w-64 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('stories.builder.generating') }}
            </p>
          </div>
        </div>

        <div v-else-if="saving" class="flex items-center justify-center py-12">
          <div class="text-center">
            <USkeleton class="h-8 w-64 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('stories.builder.saving') }}
            </p>
          </div>
        </div>

        <!-- Mode Selection (only for new stories) -->
        <UCard v-else-if="showModeSelection && !selectedMode">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">
                {{ t('stories.builder.chooseMode') }}
              </h3>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <!-- Generate from Experience -->
              <UCard
                class="cursor-pointer hover:border-primary-500 transition-colors"
                @click="
                  () => {
                    selectedMode = 'experience';
                    handleGenerateFromExperience();
                  }
                "
              >
                <div class="flex flex-col items-center text-center gap-3 p-4">
                  <u-icon name="i-heroicons-sparkles" class="w-8 h-8 text-primary-500" />
                  <h4 class="font-medium">{{ t('stories.builder.modeExperience') }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('stories.builder.modeExperienceDescription') }}
                  </p>
                </div>
              </UCard>

              <!-- Generate from Free Text -->
              <UCard
                class="cursor-pointer hover:border-primary-500 transition-colors"
                @click="selectedMode = 'freetext'"
              >
                <div class="flex flex-col items-center text-center gap-3 p-4">
                  <u-icon name="i-heroicons-document-text" class="w-8 h-8 text-primary-500" />
                  <h4 class="font-medium">{{ t('stories.builder.modeFreetext') }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('stories.builder.modeFreetextDescription') }}
                  </p>
                </div>
              </UCard>

              <!-- Manual Entry -->
              <UCard
                class="cursor-pointer hover:border-primary-500 transition-colors"
                @click="selectedMode = 'manual'"
              >
                <div class="flex flex-col items-center text-center gap-3 p-4">
                  <u-icon name="i-heroicons-pencil-square" class="w-8 h-8 text-primary-500" />
                  <h4 class="font-medium">{{ t('stories.builder.modeManual') }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('stories.builder.modeManualDescription') }}
                  </p>
                </div>
              </UCard>
            </div>
          </div>
        </UCard>

        <!-- Free Text Input Form -->
        <UCard v-else-if="selectedMode === 'freetext'">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">
                {{ t('stories.builder.modeFreetext') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('stories.builder.freetextInstructions') }}
              </p>
            </div>

            <u-form-field :label="t('stories.builder.freetextLabel')" required>
              <u-textarea
                v-model="freeTextInput"
                :placeholder="t('stories.builder.freetextPlaceholder')"
                :rows="10"
                class="w-full"
              />
            </u-form-field>

            <div class="flex justify-end gap-3">
              <u-button
                :label="t('common.cancel')"
                variant="ghost"
                @click="
                  () => {
                    selectedMode = null;
                    freeTextInput = '';
                  }
                "
              />
              <u-button
                :label="t('stories.builder.generate')"
                icon="i-heroicons-sparkles"
                :disabled="!freeTextInput.trim()"
                @click="handleSubmitFreeText"
              />
            </div>
          </div>
        </UCard>

        <story-builder
          v-else-if="selectedMode === 'manual' || (!showModeSelection && !selectedMode)"
          :experience-id="experienceId"
          mode="create"
          :show-generate-button="selectedMode !== 'manual'"
          @save="handleSave"
          @cancel="handleCancel"
          @generate-from-text="handleGenerateFromText"
          @generate-achievements="handleGenerateAchievements"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
