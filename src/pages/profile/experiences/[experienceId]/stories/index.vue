<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryList } from '@/composables/useStoryList';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

definePageMeta({
  breadcrumbLabel: 'Stories',
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const experienceId = computed(() => route.params.experienceId as string);
const companyName = ref<string>('');

// Use new story list composable
const { stories, loading, error, loadByExperience, deleteStory } = useStoryList();
const experienceService = new ExperienceService();
const storyService = new STARStoryService();
const deleting = ref(false);

// Auto-generation state
const isGenerating = ref(false);
const generationError = ref<string | null>(null);

// Navigation handlers
const handleNewStory = () => {
  router.push(`/profile/experiences/${experienceId.value}/stories/new`);
};

// Handle delete
const handleDelete = async (story: STARStory) => {
  deleting.value = true;
  try {
    await deleteStory(story.id);
  } catch (err) {
    console.error('[Stories] Delete error:', err);
  } finally {
    deleting.value = false;
  }
};

// Handle refresh
const handleRefresh = async () => {
  if (experienceId.value) {
    await loadByExperience(experienceId.value);
  }
};

/**
 * Format experience data as text for AI generation
 * Uses the format specified in AI_Interaction_Contract.md
 */
const formatExperienceAsText = (experience: Experience): string => {
  const lines = [];

  // Job Title
  lines.push(`Job Title: ${experience.title}`);

  // Company (if available)
  if (experience.companyName) {
    lines.push(`Company: ${experience.companyName}`);
  }

  // Duration
  const startDate = experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '';
  const endDate = experience.endDate
    ? new Date(experience.endDate).toLocaleDateString()
    : 'Present';
  lines.push(`Duration: ${startDate} - ${endDate}`);
  lines.push('');

  // Responsibilities
  if (experience.responsibilities && experience.responsibilities.length > 0) {
    lines.push('Responsibilities:');
    experience.responsibilities.forEach((resp) => lines.push(`- ${resp}`));
    lines.push('');
  }

  // Tasks & Achievements
  if (experience.tasks && experience.tasks.length > 0) {
    lines.push('Tasks & Achievements:');
    experience.tasks.forEach((task) => lines.push(`- ${task}`));
  }

  return lines.join('\n');
};

/**
 * Auto-generate STAR stories from experience data
 */
const handleAutoGenerate = async () => {
  isGenerating.value = true;
  generationError.value = null;

  try {
    // 1. Fetch full experience details
    const experience = await experienceService.getFullExperience(experienceId.value);
    if (!experience) {
      throw new Error('Experience not found');
    }

    // 2. Format experience as text
    const formattedText = formatExperienceAsText(experience);

    // 3. Generate STAR stories using AI
    const generatedStories = await storyService.generateStar(formattedText);

    // 4. Save all generated stories with achievements and KPIs
    for (const story of generatedStories) {
      // Generate achievements and KPIs for each story
      let achievements: string[] = [];
      let kpiSuggestions: string[] = [];

      try {
        const achievementsData = await storyService.generateAchievements(story);
        achievements = achievementsData.achievements || [];
        kpiSuggestions = achievementsData.kpiSuggestions || [];
      } catch (achievementsErr) {
        console.error('[Stories] Failed to generate achievements for story:', achievementsErr);
        // Continue without achievements - story can still be saved
      }

      // Create complete story with achievements and KPIs
      const completeStory = {
        ...story,
        achievements,
        kpiSuggestions,
      };

      await storyService.createAndLinkStory(completeStory, experienceId.value);
    }

    // 5. Reload stories list
    await loadByExperience(experienceId.value);
  } catch (err) {
    console.error('[Stories] Auto-generation error:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error occurred';
  } finally {
    isGenerating.value = false;
  }
};

// Load data
onMounted(async () => {
  if (experienceId.value) {
    // Load experience details
    try {
      const experience = await experienceService.getFullExperience(experienceId.value);
      if (experience) {
        companyName.value = experience.companyName || experience.title;
      }
    } catch (err) {
      console.error('[Stories] Error loading experience:', err);
    }

    // Load stories using new composable
    await loadByExperience(experienceId.value);
  }
});
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('stories.list.title')"
        :description="companyName"
        :links="[
          {
            label: t('experiences.list.title'),
            to: '/profile/experiences',
            icon: 'i-heroicons-arrow-left',
          },
          {
            label: t('stories.list.addNew'),
            icon: 'i-heroicons-plus',
            onClick: handleNewStory,
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

        <!-- Generation Error Alert -->
        <UAlert
          v-if="generationError"
          color="red"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="generationError"
          class="mb-6"
        />

        <!-- Loading State -->
        <div v-if="loading || isGenerating" class="flex flex-col items-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
          <p v-if="isGenerating" class="text-center">
            {{ t('stories.list.generating') }}
          </p>
        </div>

        <!-- Empty State -->
        <UEmpty
          v-else-if="stories.length === 0"
          :title="t('stories.list.empty')"
          :description="t('stories.list.emptyDescription')"
          icon="i-heroicons-document-text"
        >
          <template #actions>
            <UButton
              :label="t('stories.list.autoGenerate')"
              icon="i-heroicons-sparkles"
              color="primary"
              variant="soft"
              @click="handleAutoGenerate"
            />
            <UButton
              :label="t('stories.list.addNew')"
              icon="i-heroicons-plus"
              @click="handleNewStory"
            />
          </template>
        </UEmpty>

        <!-- Story List Component -->
        <StoryList
          v-else
          :stories="stories"
          :loading="loading || deleting"
          :experience-id="experienceId"
          @delete="handleDelete"
          @refresh="handleRefresh"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
