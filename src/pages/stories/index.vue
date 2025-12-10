<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryList } from '@/composables/useStoryList';
import type { STARStory } from '@/domain/starstory/STARStory';

const router = useRouter();
const { t } = useI18n();
const { stories, loading, error, loadAll, search } = useStoryList();

const searchQuery = ref('');
const filteredStories = ref<STARStory[]>([]);

onMounted(async () => {
  await loadAll();
  filteredStories.value = stories.value;
});

const handleSearch = () => {
  filteredStories.value = search(searchQuery.value);
};

const handleStoryClick = (story: STARStory) => {
  router.push(`/stories/${story.id}`);
};

const handleCreateNew = () => {
  router.push('/stories/new');
};
</script>

<template>
  <UContainer>
    <UPageHeader :title="t('stories.global.title')" :description="t('stories.global.description')">
      <template #actions>
        <UButton
          :label="t('stories.list.addNew')"
          icon="i-heroicons-plus"
          @click="handleCreateNew"
        />
      </template>
    </UPageHeader>

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

      <!-- Story List -->
      <StoryList :stories="filteredStories" :loading="loading" @story-click="handleStoryClick" />
    </UPageBody>
  </UContainer>
</template>
