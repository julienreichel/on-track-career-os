<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { STARStory } from '@/domain/starstory/STARStory';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const experienceId = computed(() => route.params.experienceId as string);
const experienceTitle = ref<string>('');

// Story engine
const { stories, loading, error, loadStories } = useStoryEngine(experienceId);
const storyService = new ExperienceService();

// Table columns configuration
const columns = computed(() => [
  {
    key: 'index',
    label: '#',
  },
  {
    key: 'preview',
    label: t('stories.table.preview'),
  },
  {
    key: 'hasAchievements',
    label: t('stories.table.hasAchievements'),
  },
  {
    key: 'actions',
    label: t('stories.table.actions'),
  },
]);

// Generate preview text (first N chars of situation)
const PREVIEW_MAX_LENGTH = 100;
const getPreview = (story: STARStory) => {
  const text = story.situation || story.result || '';
  return text.length > PREVIEW_MAX_LENGTH ? `${text.substring(0, PREVIEW_MAX_LENGTH)}...` : text;
};

// Check if story has achievements
const hasAchievements = (story: STARStory) => {
  return story.achievements && story.achievements.length > 0;
};

// Navigation handlers
const handleNewStory = () => {
  router.push(`/profile/experiences/${experienceId.value}/stories/new`);
};

const handleEdit = (storyId: string) => {
  router.push(`/profile/experiences/${experienceId.value}/stories/${storyId}/edit`);
};

const handleDelete = async (storyId: string) => {
  if (!confirm(t('stories.delete.message'))) {
    return;
  }

  try {
    const storyEngine = useStoryEngine();
    await storyEngine.deleteStory(storyId);
    // Reload stories
    await loadStories();
  } catch (err) {
    console.error('[Stories] Delete error:', err);
  }
};

// Load data
onMounted(async () => {
  if (experienceId.value) {
    // Load experience details
    try {
      const experience = await storyService.getFullExperience(experienceId.value);
      if (experience) {
        experienceTitle.value = experience.title;
      }
    } catch (err) {
      console.error('[Stories] Error loading experience:', err);
    }

    // Load stories
    await loadStories();
  }
});
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('stories.list.title')"
        :description="experienceTitle"
        :links="[
          {
            label: t('experiences.list.title'),
            to: '/profile/experiences',
            icon: 'i-heroicons-arrow-left',
          },
        ]"
      >
        <template #actions>
          <UButton
            :label="t('stories.list.addNew')"
            icon="i-heroicons-plus"
            color="primary"
            @click="handleNewStory"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <UCard v-if="error" color="red">
          <p>{{ error }}</p>
        </UCard>

        <UCard v-else-if="loading">
          <div class="flex items-center justify-center py-12">
            <USkeleton class="h-8 w-full" />
          </div>
        </UCard>

        <UCard v-else-if="stories.length === 0">
          <UEmpty
            :title="t('stories.list.empty')"
            :description="t('stories.list.emptyDescription')"
            icon="i-heroicons-document-text"
          >
            <template #actions>
              <UButton
                :label="t('stories.list.addNew')"
                icon="i-heroicons-plus"
                @click="handleNewStory"
              />
            </template>
          </UEmpty>
        </UCard>

        <UTable
          v-else
          :columns="columns"
          :rows="stories.map((story, idx) => ({
            index: idx + 1,
            story,
            preview: getPreview(story),
            hasAchievements: hasAchievements(story),
          }))"
        >
          <template #preview-data="{ row }">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ row.preview }}
            </p>
          </template>

          <template #hasAchievements-data="{ row }">
            <UBadge
              v-if="row.hasAchievements"
              :label="t('stories.status.withAchievements')"
              color="primary"
              size="xs"
            />
            <UBadge
              v-else
              :label="t('stories.status.draft')"
              color="neutral"
              size="xs"
            />
          </template>

          <template #actions-data="{ row }">
            <div class="flex gap-2">
              <UButton
                icon="i-heroicons-pencil-square"
                variant="ghost"
                color="primary"
                size="xs"
                :aria-label="t('stories.list.edit')"
                @click="handleEdit(row.story.id)"
              />
              <UButton
                icon="i-heroicons-trash"
                variant="ghost"
                color="red"
                size="xs"
                :aria-label="t('stories.list.delete')"
                @click="handleDelete(row.story.id)"
              />
            </div>
          </template>
        </UTable>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
