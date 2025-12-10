<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import StoryBuilder from '@/components/StoryBuilder.vue';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

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

// Handle AI generation from free text
const handleGenerateFromText = async (freeText: string) => {
  try {
    const result = await runStarInterview(freeText);
    if (result) {
      // Draft is automatically updated by runStarInterview
    }
  } catch (err) {
    console.error('[NewStory] Generation error:', err);
  }
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

        <story-builder
          v-else
          :experience-id="experienceId"
          mode="create"
          @save="handleSave"
          @cancel="handleCancel"
          @generate-from-text="handleGenerateFromText"
          @generate-achievements="handleGenerateAchievements"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
