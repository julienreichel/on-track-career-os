<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from '@/domain/experience/Experience';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';

definePageMeta({
  breadcrumbLabel: 'New Story',
});

const { t } = useI18n();
const router = useRouter();
const { userId } = useAuthUser();

const experienceService = new ExperienceService();
const storyService = new STARStoryService();

const selectedExperienceIds = ref<string[]>([]);
const isGenerating = ref(false);
const generationError = ref<string | null>(null);

const hasSelection = computed(() => selectedExperienceIds.value.length > 0);

const handleCancel = () => {
  void router.push('/profile/stories');
};

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

const handleGenerate = async () => {
  if (!hasSelection.value) return;

  isGenerating.value = true;
  generationError.value = null;

  try {
    for (const experienceId of selectedExperienceIds.value) {
      const experience = await experienceService.getFullExperience(experienceId);
      if (!experience) {
        throw new Error('Experience not found');
      }

      const formattedText = formatExperienceAsText(experience);
      const generatedStories = await storyService.generateStar(formattedText);

      for (const story of generatedStories) {
        let achievements: string[] = [];
        let kpiSuggestions: string[] = [];

        try {
          const storyForGeneration = {
            title: story.title ?? '',
            situation: story.situation ?? '',
            task: story.task ?? '',
            action: story.action ?? '',
            result: story.result ?? '',
          };
          const achievementsData = await storyService.generateAchievements(storyForGeneration);
          achievements = achievementsData.achievements || [];
          kpiSuggestions = achievementsData.kpiSuggestions || [];
        } catch (achievementsErr) {
          console.error('[Stories] Failed to generate achievements for story:', achievementsErr);
        }

        const storyToSave = {
          title: story.title ?? '',
          situation: story.situation ?? '',
          task: story.task ?? '',
          action: story.action ?? '',
          result: story.result ?? '',
        };

        await storyService.createAndLinkStory(storyToSave, experienceId, {
          achievements,
          kpiSuggestions,
        });
      }
    }

    void router.push('/profile/stories');
  } catch (err) {
    console.error('[Stories] Auto-generation error:', err);
    generationError.value = err instanceof Error ? err.message : t('common.error');
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <UPage>
    <UPageHeader :title="t('stories.new.title')" :description="t('stories.new.description')" />

    <UPageBody>
      <UAlert
        v-if="generationError"
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="generationError"
        class="mb-6"
      />

      <div v-if="isGenerating" class="space-y-4">
        <ListSkeletonCards />
        <p class="text-center text-sm text-gray-500">
          {{ t('stories.list.generating') }}
        </p>
      </div>

      <UCard v-else>
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ t('stories.new.selectTitle') }}
            </h2>
            <p class="text-gray-600">
              {{ t('stories.new.selectDescription') }}
            </p>
          </div>

          <CvExperiencePicker v-model="selectedExperienceIds" :user-id="userId" />

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton color="neutral" variant="outline" @click="handleCancel">
              {{ t('stories.new.cancel') }}
            </UButton>
            <UButton
              color="primary"
              :disabled="!hasSelection"
              @click="handleGenerate"
            >
              {{ t('stories.new.generate') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>
