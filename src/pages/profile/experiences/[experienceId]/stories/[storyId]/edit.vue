<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import StoryBuilder from '@/components/StoryBuilder.vue';
import type { AchievementsAndKpis } from '@/domain/ai-operations/AchievementsAndKpis';

defineOptions({
  name: 'EditStoryPage',
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const experienceId = computed(() => route.params.experienceId as string);
const storyId = computed(() => route.params.storyId as string);

const {
  selectedStory,
  loading,
  generating,
  saving,
  error,
  loadStory,
  generateAchievements,
  updateStory,
} = useStoryEngine(experienceId);

const generatedAchievements = ref<AchievementsAndKpis | null>(null);

// Handle achievements generation
const handleGenerateAchievements = async () => {
  try {
    const result = await generateAchievements();
    if (result) {
      generatedAchievements.value = result;
    }
  } catch (err) {
    console.error('[EditStory] Achievements generation error:', err);
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
    const updated = await updateStory(storyId.value, storyData);
    if (updated) {
      router.push(`/profile/experiences/${experienceId.value}/stories`);
    }
  } catch (err) {
    console.error('[EditStory] Save error:', err);
  }
};

// Handle cancel
const handleCancel = () => {
  router.push(`/profile/experiences/${experienceId.value}/stories`);
};

// Load story on mount
onMounted(async () => {
  if (storyId.value) {
    await loadStory(storyId.value);
  }
});
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader>
        <template #headline>
          <UButton
            :label="t('stories.builder.backToStories')"
            variant="link"
            icon="i-heroicons-arrow-left"
            @click="handleCancel"
          />
        </template>
        <template #title>
          {{ t('stories.builder.editTitle') }}
        </template>
        <template #description>
          {{ t('stories.builder.editDescription') }}
        </template>
      </UPageHeader>

      <UPageBody>
        <UAlert
          v-if="error"
          color="red"
          icon="i-heroicons-exclamation-circle"
          :title="t('common.error')"
          :description="error"
        />

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <USkeleton class="h-8 w-64 mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('stories.builder.loading') }}
            </p>
          </div>
        </div>

        <div v-else-if="generating" class="flex items-center justify-center py-12">
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
          v-else-if="selectedStory"
          :story="selectedStory"
          :experience-id="experienceId"
          mode="edit"
          @save="handleSave"
          @cancel="handleCancel"
          @generate-achievements="handleGenerateAchievements"
        />

        <UAlert
          v-else
          color="yellow"
          icon="i-heroicons-exclamation-triangle"
          :title="t('stories.builder.notFound')"
          :description="t('stories.builder.notFoundDescription')"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
