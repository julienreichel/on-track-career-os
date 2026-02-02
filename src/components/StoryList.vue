<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { StoryWithExperience } from '@/composables/useStoryList';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';

const props = defineProps<{
  stories: StoryWithExperience[];
  loading?: boolean;
  showCompanyNames?: boolean;
  experienceId?: string;
}>();

const emit = defineEmits<{
  delete: [story: STARStory];
  refresh: [];
}>();

const { t } = useI18n();
const router = useRouter();

const selectedStory = ref<STARStory | null>(null);
const showViewModal = ref(false);

const hasStories = computed(() => props.stories.length > 0);

const getCompanyName = (story: STARStory): string | undefined => {
  if (!story.experienceId || !props.showCompanyNames) return undefined;
  return (story as StoryWithExperience).companyName;
};

const getExperienceName = (story: STARStory): string | undefined => {
  if (!story.experienceId) return undefined;
  return (story as StoryWithExperience).experienceName;
};

const handleView = (story: STARStory) => {
  selectedStory.value = story;
  showViewModal.value = true;
};

const handleEdit = (story: STARStory) => {
  if (!story.experienceId) {
    console.error('[StoryList] Cannot edit story without experienceId');
    return;
  }
  void router.push(`/profile/experiences/${story.experienceId}/stories/${story.id}`);
};

const handleDelete = (story: STARStory) => {
  emit('delete', story);
};
</script>

<template>
  <div>
    <!-- Loading State -->
    <ListSkeletonCards v-if="loading" />

    <!-- Empty State -->
    <UEmpty
      v-else-if="!hasStories"
      :title="t('storyList.emptyTitle')"
      :description="t('storyList.emptyDescription')"
      icon="i-heroicons-document-text"
    >
      <template #actions>
        <UButton
          :label="t('storyList.createFirst')"
          icon="i-heroicons-plus"
          to="/profile/stories/new"
        />
      </template>
    </UEmpty>

    <!-- Story Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StoryCard
        v-for="story in stories"
        :key="story.id"
        :story="story"
        :company-name="getCompanyName(story)"
        :experience-name="getExperienceName(story)"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- View Story Modal -->
    <StoryViewModal
      v-if="selectedStory"
      v-model:open="showViewModal"
      :story="selectedStory"
      :experience-name="getExperienceName(selectedStory)"
    />
  </div>
</template>
