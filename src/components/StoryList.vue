<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { STARStory } from '@/domain/starstory/STARStory';

const props = defineProps<{
  stories: STARStory[];
  loading?: boolean;
  experienceNames?: Record<string, string>;
}>();

const emit = defineEmits<{
  'story-click': [story: STARStory];
}>();

const { t } = useI18n();

const hasStories = computed(() => props.stories.length > 0);

const getExperienceName = (story: STARStory): string | undefined => {
  if (!story.experienceId || !props.experienceNames) return undefined;
  return props.experienceNames[story.experienceId];
};

const handleStoryClick = (story: STARStory) => {
  emit('story-click', story);
};
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <USkeleton v-for="i in 6" :key="i" class="h-40" />
    </div>

    <!-- Empty State -->
    <UEmpty
      v-else-if="!hasStories"
      :title="t('storyList.emptyTitle')"
      :description="t('storyList.emptyDescription')"
      icon="i-heroicons-document-text"
    >
      <template #actions>
        <UButton :label="t('storyList.createFirst')" icon="i-heroicons-plus" to="/stories/new" />
      </template>
    </UEmpty>

    <!-- Story Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StoryCard
        v-for="story in stories"
        :key="story.id"
        :story="story"
        :experience-name="getExperienceName(story)"
        @click="handleStoryClick(story)"
      />
    </div>
  </div>
</template>
