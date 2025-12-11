<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryList } from '@/composables/useStoryList';
import { useExperience } from '@/application/experience/useExperience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

definePageMeta({
  breadcrumbLabel: 'All Stories',
});

const router = useRouter();
const { t } = useI18n();

// Use new story list composable
const { stories, loading, error, loadAll, search } = useStoryList();
const searchQuery = ref('');
const filteredStories = ref<STARStory[]>([]);

// Experience data for mapping IDs to names
const experienceMap = ref<Map<string, Experience>>(new Map());
const loadingExperiences = ref(false);

// Build experience name map for StoryList component
const experienceNames = computed(() => {
  const names: Record<string, string> = {};
  experienceMap.value.forEach((exp, id) => {
    names[id] = exp.companyName || exp.title || t('stories.global.unknownExperience');
  });
  return names;
});

// Handle search
const handleSearch = () => {
  filteredStories.value = search(searchQuery.value);
};

// Navigation handlers
const handleStoryClick = (story: STARStory) => {
  if (!story.experienceId) {
    console.error('[Stories] Cannot navigate to story without experienceId');
    return;
  }
  router.push(`/profile/experiences/${story.experienceId}/stories/${story.id}`);
};

const handleBackToProfile = () => {
  router.push('/profile');
};

// Page header links
const headerLinks = computed(() => [
  {
    label: t('common.backToProfile'),
    icon: 'i-heroicons-arrow-left',
    onClick: handleBackToProfile,
  },
]);

// Load data on mount
onMounted(async () => {
  loadingExperiences.value = true;
  try {
    // Load all experiences to build the map
    const { loadAllExperiences, allExperiences } = useExperience();
    await loadAllExperiences();

    // Build experience map
    allExperiences.value.forEach((exp) => {
      experienceMap.value.set(exp.id, exp);
    });
  } catch (err) {
    console.error('[Stories] Error loading experiences:', err);
  } finally {
    loadingExperiences.value = false;
  }

  // Load all stories using new composable
  await loadAll();
  filteredStories.value = stories.value;
});
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('stories.global.title')"
      :description="t('stories.global.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <!-- Search Bar -->
      <div class="mb-6">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('common.search', 'Search stories...')"
          size="lg"
          @input="handleSearch"
        />
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        color="red"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="error"
        class="mb-6"
      />

      <!-- Story List Component -->
      <StoryList
        :stories="searchQuery ? filteredStories : stories"
        :loading="loading || loadingExperiences"
        :experience-names="experienceNames"
        @story-click="handleStoryClick"
      />
    </UPageBody>
  </UPage>
</template>
