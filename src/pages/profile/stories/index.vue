<script setup lang="ts">
import { ref, onMounted, computed, h, resolveComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { TableColumn } from '@nuxt/ui';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import { useExperience } from '@/application/experience/useExperience';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

definePageMeta({
  breadcrumbLabel: 'All Stories',
});

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

const router = useRouter();
const { t } = useI18n();

// Story engine
const { stories, loading, error, loadAllStoriesForUser } = useStoryEngine();

// Experience data for mapping IDs to names
const experienceMap = ref<Map<string, Experience>>(new Map());
const loadingExperiences = ref(false);

// Generate preview text (first N chars of result or situation)
const PREVIEW_MAX_LENGTH = 80;
const getPreview = (story: STARStory) => {
  const text = story.result || story.situation || '';
  return text.length > PREVIEW_MAX_LENGTH ? `${text.substring(0, PREVIEW_MAX_LENGTH)}...` : text;
};

// Check if story has achievements
const hasAchievements = (story: STARStory) => {
  return story.achievements && story.achievements.length > 0;
};

// Check if story has KPIs
const hasKpis = (story: STARStory) => {
  return story.kpiSuggestions && story.kpiSuggestions.length > 0;
};

// Get experience name from map
const getExperienceName = (experienceId?: string) => {
  if (!experienceId) return t('stories.global.unknownExperience');
  const experience = experienceMap.value.get(experienceId);
  return experience?.companyName || experience?.title || t('stories.global.unknownExperience');
};

// Enriched stories with experience info
const enrichedStories = computed(() => {
  return stories.value.map((story) => ({
    ...story,
    experienceName: getExperienceName(story.experienceId),
    hasAchievements: hasAchievements(story),
    hasKpis: hasKpis(story),
  }));
});

// Table columns configuration
const columns = computed<TableColumn<(typeof enrichedStories.value)[0]>[]>(() => [
  {
    accessorKey: 'experienceName',
    header: t('stories.global.experience'),
    cell: ({ row }) => row.original.experienceName,
  },
  {
    accessorKey: 'result',
    header: t('stories.table.preview'),
    cell: ({ row }) => getPreview(row.original),
  },
  {
    id: 'badges',
    header: t('stories.global.status'),
    cell: ({ row }) => {
      const badges = [];
      if (row.original.hasAchievements) {
        badges.push(
          h(UBadge, {
            color: 'primary',
            label: t('stories.global.achievements'),
            size: 'xs',
            class: 'mr-1',
          })
        );
      }
      if (row.original.hasKpis) {
        badges.push(
          h(UBadge, {
            color: 'green',
            label: t('stories.global.kpis'),
            size: 'xs',
          })
        );
      }
      if (!row.original.hasAchievements && !row.original.hasKpis) {
        badges.push(
          h(UBadge, {
            color: 'neutral',
            label: t('stories.status.draft'),
            size: 'xs',
          })
        );
      }
      return h('div', { class: 'flex gap-1' }, badges);
    },
  },
  {
    id: 'actions',
    header: t('stories.table.actions'),
    cell: ({ row }) => {
      const story = row.original;
      return h('div', { class: 'flex gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'ghost',
          color: 'primary',
          size: 'xs',
          'aria-label': t('stories.list.edit'),
          onClick: () => handleEdit(story.id, story.experienceId),
        }),
        h(UButton, {
          icon: 'i-heroicons-arrow-right',
          variant: 'ghost',
          color: 'neutral',
          size: 'xs',
          'aria-label': t('stories.global.goToExperience'),
          onClick: () => handleGoToExperience(story.experienceId),
        }),
      ]);
    },
  },
]);

// Navigation handlers
const handleEdit = (storyId: string, experienceId?: string) => {
  if (!experienceId) {
    console.error('[Stories] Cannot edit story without experienceId');
    return;
  }
  router.push(`/profile/experiences/${experienceId}/stories/${storyId}`);
};

const handleGoToExperience = (experienceId?: string) => {
  if (!experienceId) {
    console.error('[Stories] Cannot navigate to experience without experienceId');
    return;
  }
  router.push(`/profile/experiences/${experienceId}`);
};

const handleBackToProfile = () => {
  router.push('/profile');
};

// Load unique experience IDs from stories and fetch their data
const loadExperiences = async () => {
  loadingExperiences.value = true;
  try {
    // Get unique experience IDs
    const experienceIds = new Set<string>();
    stories.value.forEach((story) => {
      if (story.experienceId) {
        experienceIds.add(story.experienceId);
      }
    });

    // Load each experience
    const experienceData = new Map<string, Experience>();
    await Promise.all(
      Array.from(experienceIds).map(async (id) => {
        const { item, load } = useExperience(id);
        await load();
        if (item.value) {
          experienceData.set(id, item.value);
        }
      })
    );

    experienceMap.value = experienceData;
  } catch (err) {
    console.error('[Stories] Error loading experiences:', err);
  } finally {
    loadingExperiences.value = false;
  }
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
  await loadAllStoriesForUser();
  await loadExperiences();
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
      <!-- Loading state -->
      <div v-if="loading || loadingExperiences" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary" />
      </div>

      <!-- Error state -->
      <UAlert v-else-if="error" color="red" :title="t('common.error')" :description="error" />

      <!-- Empty state -->
      <UEmpty
        v-else-if="!stories.length"
        :title="t('stories.global.empty')"
        :description="t('stories.global.emptyDescription')"
        icon="i-heroicons-document-text"
      >
        <template #actions>
          <UButton
            :label="t('stories.global.goToExperiences')"
            icon="i-heroicons-arrow-right"
            @click="router.push('/profile/experiences')"
          />
        </template>
      </UEmpty>

      <!-- Stories table -->
      <UCard v-else>
        <UTable :columns="columns" :data="enrichedStories" />
      </UCard>
    </UPageBody>
  </UPage>
</template>
