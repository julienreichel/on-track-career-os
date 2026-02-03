<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStoryList } from '@/composables/useStoryList';
import { useGuidance } from '@/composables/useGuidance';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { PageHeaderLink } from '@/types/ui';
import EmptyStateActionCard from '@/components/guidance/EmptyStateActionCard.vue';
import LockedFeatureCard from '@/components/guidance/LockedFeatureCard.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';

definePageMeta({
  breadcrumbLabel: 'All Stories',
});

const { t } = useI18n();

// Use new story list composable
const { stories, loading, error, loadAll, search, deleteStory } = useStoryList();
const searchQuery = ref('');
const filteredStories = ref<STARStory[]>([]);
const deleting = ref(false);
const hasLoaded = ref(false);
const { guidance } = useGuidance('profile-stories', () => ({
  storiesCount: stories.value.length,
}));

// Handle search
const handleSearch = () => {
  filteredStories.value = search(searchQuery.value);
};

// Handle delete
const handleDelete = async (story: STARStory) => {
  deleting.value = true;
  try {
    await deleteStory(story.id);
    // Refresh the search results
    if (searchQuery.value) {
      filteredStories.value = search(searchQuery.value);
    }
  } catch (err) {
    console.error('[Stories] Delete error:', err);
  } finally {
    deleting.value = false;
  }
};

// Handle refresh
const handleRefresh = async () => {
  await loadAll();
  if (searchQuery.value) {
    filteredStories.value = search(searchQuery.value);
  } else {
    filteredStories.value = stories.value;
  }
};

// Page header links
const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToProfile'),
    icon: 'i-heroicons-arrow-left',
    to: '/profile',
  },
  {
    label: t('common.actions.create'),
    icon: 'i-heroicons-sparkles',
    to: '/profile/stories/new',
  },
]);

// Load data on mount
onMounted(async () => {
  hasLoaded.value = false;
  try {
    await loadAll();
    filteredStories.value = stories.value;
  } finally {
    hasLoaded.value = true;
  }
});
</script>

<template>
  <UPage>
    <UPageHeader
      :title="t('stories.page.title')"
      :description="t('stories.page.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <GuidanceBanner v-if="guidance.banner" :banner="guidance.banner" class="mb-6" />

      <LockedFeatureCard
        v-for="feature in guidance.lockedFeatures"
        :key="feature.id"
        :feature="feature"
        class="mb-6"
      />

      <EmptyStateActionCard
        v-if="guidance.emptyState && !guidance.lockedFeatures?.length && !loading && hasLoaded"
        class="mb-6"
        :empty-state="guidance.emptyState"
      />

      <!-- Search Bar -->
      <div v-if="!guidance.emptyState && !guidance.lockedFeatures?.length" class="mb-6">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('common.search', 'Search stories...')"
          size="lg"
          class="w-1/3"
          @input="handleSearch"
        />
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="error"
        class="mb-6"
      />

      <!-- Story List Component -->
      <StoryList
        v-if="!guidance.emptyState && !guidance.lockedFeatures?.length"
        :stories="searchQuery ? filteredStories : stories"
        :loading="loading || deleting || !hasLoaded"
        show-company-names
        @delete="handleDelete"
        @refresh="handleRefresh"
      />
    </UPageBody>
  </UPage>
</template>
