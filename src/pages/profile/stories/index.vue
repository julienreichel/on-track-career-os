<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryList } from '@/composables/useStoryList';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { PageHeaderLink } from '@/types/ui';

definePageMeta({
  breadcrumbLabel: 'All Stories',
});

const router = useRouter();
const { t } = useI18n();

// Use new story list composable
const { stories, loading, error, loadAll, search, deleteStory } = useStoryList();
const searchQuery = ref('');
const filteredStories = ref<STARStory[]>([]);
const deleting = ref(false);

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

const handleBackToProfile = () => {
  router.push('/profile');
};

// Page header links
const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToProfile'),
    icon: 'i-heroicons-arrow-left',
    onClick: handleBackToProfile,
  },
]);

// Load data on mount
onMounted(async () => {
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
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="error"
        class="mb-6"
      />

      <!-- Story List Component -->
      <StoryList
        :stories="searchQuery ? filteredStories : stories"
        :loading="loading || deleting"
        show-company-names
        @delete="handleDelete"
        @refresh="handleRefresh"
      />
    </UPageBody>
  </UPage>
</template>
