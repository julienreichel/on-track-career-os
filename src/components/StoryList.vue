<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { STARStory } from '@/domain/starstory/STARStory';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import type { Experience } from '@/domain/experience/Experience';

const props = defineProps<{
  stories: STARStory[];
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

const experiences = ref<Experience[]>([]);
const loadingExperiences = ref(false);
const selectedStory = ref<STARStory | null>(null);
const showViewModal = ref(false);

const hasStories = computed(() => props.stories.length > 0);

const experienceMap = computed(() => {
  const map: Record<string, Experience> = {};
  experiences.value.forEach((exp) => {
    map[exp.id] = exp;
  });
  return map;
});

const getCompanyName = (story: STARStory): string | undefined => {
  if (!story.experienceId || !props.showCompanyNames) return undefined;
  return experienceMap.value[story.experienceId]?.companyName;
};

const getExperienceName = (story: STARStory): string | undefined => {
  if (!story.experienceId) return undefined;
  return experienceMap.value[story.experienceId]?.title;
};

const loadExperiences = async () => {
  if (!props.showCompanyNames) return;

  loadingExperiences.value = true;
  try {
    const service = new ExperienceService();
    // Get unique experience IDs from stories
    const experienceIds = [...new Set(props.stories.map((s) => s.experienceId).filter(Boolean))];

    // Load all experiences
    const loadedExperiences = await Promise.all(
      experienceIds.map((id) => service.getFullExperience(id as string))
    );

    experiences.value = loadedExperiences.filter((exp): exp is Experience => exp !== null);
  } catch (error) {
    console.error('[StoryList] Failed to load experiences:', error);
  } finally {
    loadingExperiences.value = false;
  }
};

const handleView = (story: STARStory) => {
  selectedStory.value = story;
  showViewModal.value = true;
};

const handleEdit = (story: STARStory) => {
  router.push(`/stories/${story.id}/edit`);
};

const handleDelete = (story: STARStory) => {
  emit('delete', story);
};

onMounted(() => {
  loadExperiences();
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading || loadingExperiences"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <USkeleton v-for="i in 6" :key="i" class="h-64" />
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
