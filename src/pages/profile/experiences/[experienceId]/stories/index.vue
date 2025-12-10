<script setup lang="ts">
import { ref, onMounted, computed, h, resolveComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { TableColumn } from '@nuxt/ui';
import { useStoryEngine } from '@/application/starstory/useStoryEngine';
import { ExperienceService } from '@/domain/experience/ExperienceService';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const experienceId = computed(() => route.params.experienceId as string);
const experienceTitle = ref<string>('');

// Story engine
const { stories, loading, error, loadStories } = useStoryEngine(experienceId);
const experienceService = new ExperienceService();
const storyService = new STARStoryService();

// Auto-generation state
const isGenerating = ref(false);
const generationError = ref<string | null>(null);

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

// Table columns configuration using TanStack Table API
const columns = computed<TableColumn<STARStory>[]>(() => [
  {
    accessorKey: 'situation',
    header: t('stories.table.preview'),
    cell: ({ row }) => getPreview(row.original),
  },
  {
    id: 'achievements',
    header: t('stories.table.hasAchievements'),
    cell: ({ row }) => {
      const hasAch = hasAchievements(row.original);
      return h(UBadge, {
        color: hasAch ? 'primary' : 'neutral',
        label: hasAch ? t('stories.status.withAchievements') : t('stories.status.draft'),
        size: 'xs',
      });
    },
  },
  {
    id: 'actions',
    header: t('stories.table.actions'),
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'ghost',
          color: 'primary',
          size: 'xs',
          'aria-label': t('stories.list.edit'),
          onClick: () => handleEdit(row.original.id),
        }),
        h(UButton, {
          icon: 'i-heroicons-trash',
          variant: 'ghost',
          color: 'red',
          size: 'xs',
          'aria-label': t('stories.list.delete'),
          onClick: () => handleDelete(row.original.id),
        }),
      ]);
    },
  },
]);

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

/**
 * Format experience data as text for AI generation
 * Uses the format specified in AI_Interaction_Contract.md
 */
const formatExperienceAsText = (experience: Experience): string => {
  const lines = [];

  // Job Title
  lines.push(`Job Title: ${experience.title}`);

  // Company (if available)
  if (experience.companyName) {
    lines.push(`Company: ${experience.companyName}`);
  }

  // Duration
  const startDate = experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '';
  const endDate = experience.endDate
    ? new Date(experience.endDate).toLocaleDateString()
    : 'Present';
  lines.push(`Duration: ${startDate} - ${endDate}`);
  lines.push('');

  // Responsibilities
  if (experience.responsibilities && experience.responsibilities.length > 0) {
    lines.push('Responsibilities:');
    experience.responsibilities.forEach((resp) => lines.push(`- ${resp}`));
    lines.push('');
  }

  // Tasks & Achievements
  if (experience.tasks && experience.tasks.length > 0) {
    lines.push('Tasks & Achievements:');
    experience.tasks.forEach((task) => lines.push(`- ${task}`));
  }

  return lines.join('\n');
};

/**
 * Auto-generate STAR stories from experience data
 */
const handleAutoGenerate = async () => {
  isGenerating.value = true;
  generationError.value = null;

  try {
    // 1. Fetch full experience details
    const experience = await experienceService.getFullExperience(experienceId.value);
    if (!experience) {
      throw new Error('Experience not found');
    }

    // 2. Format experience as text
    const formattedText = formatExperienceAsText(experience);

    // 3. Generate STAR stories using AI
    const generatedStories = await storyService.generateStar(formattedText);

    // 4. Save all generated stories
    for (const story of generatedStories) {
      await storyService.createAndLinkStory(story, experienceId.value);
    }

    // 5. Reload stories list
    await loadStories();
  } catch (err) {
    console.error('[Stories] Auto-generation error:', err);
    generationError.value = err instanceof Error ? err.message : 'Unknown error occurred';
  } finally {
    isGenerating.value = false;
  }
};

// Load data
onMounted(async () => {
  if (experienceId.value) {
    // Load experience details
    try {
      const experience = await experienceService.getFullExperience(experienceId.value);
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
          {
            label: t('stories.list.addNew'),
            icon: 'i-heroicons-plus',
            onClick: handleNewStory,
          },
        ]"
      />

      <UPageBody>
        <UCard v-if="error" color="red">
          <p>{{ error }}</p>
        </UCard>

        <UCard v-else-if="loading || isGenerating">
          <div class="flex flex-col items-center justify-center py-12 gap-4">
            <USkeleton class="h-8 w-full" />
            <p v-if="isGenerating" class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('stories.list.generating') }}
            </p>
          </div>
        </UCard>

        <UCard v-else-if="stories.length === 0">
          <!-- Show generation error if any -->
          <UAlert
            v-if="generationError"
            color="red"
            icon="i-heroicons-exclamation-triangle"
            :title="generationError"
            class="mb-4"
          />

          <UEmpty
            :title="t('stories.list.empty')"
            :description="t('stories.list.emptyDescription')"
            icon="i-heroicons-document-text"
          >
            <template #actions>
              <div class="flex gap-2">
                <u-button
                  :label="t('stories.list.autoGenerate')"
                  icon="i-heroicons-sparkles"
                  color="primary"
                  variant="soft"
                  @click="handleAutoGenerate"
                />
                <u-button
                  :label="t('stories.list.addNew')"
                  icon="i-heroicons-plus"
                  @click="handleNewStory"
                />
              </div>
            </template>
          </UEmpty>
        </UCard>

        <UTable v-else :columns="columns" :data="stories" :loading="loading" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
