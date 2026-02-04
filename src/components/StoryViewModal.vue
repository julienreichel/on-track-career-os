<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { STARStory } from '@/domain/starstory/STARStory';

const props = defineProps<{
  story: STARStory;
  experienceName?: string;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useI18n();

const hasAchievements = computed(() => (props.story.achievements?.length || 0) > 0);
const hasKpis = computed(() => (props.story.kpiSuggestions?.length || 0) > 0);

const close = () => {
  emit('update:open', false);
};
</script>

<template>
  <UModal
    :open="open"
    :title="story.title || t('stories.detail.title')"
    :description="t('stories.detail.description')"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Experience Name -->
        <div v-if="experienceName" class="text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-heroicons-briefcase" class="w-4 h-4 mr-1" />
          {{ experienceName }}
        </div>

        <!-- STAR Content -->
        <div class="prose prose-sm max-w-none dark:prose-invert">
          <p class="text-gray-700 dark:text-gray-300">{{ story.situation }}</p>
          <p class="text-gray-700 dark:text-gray-300">{{ story.task }}</p>
          <p class="text-gray-700 dark:text-gray-300">{{ story.action }}</p>
          <p class="text-gray-700 dark:text-gray-300">{{ story.result }}</p>
        </div>

        <!-- Achievements -->
        <div v-if="hasAchievements" class="border-t pt-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <UIcon name="i-heroicons-trophy" class="w-4 h-4 mr-2" />
            {{ t('stories.detail.achievements') }}
          </h4>
          <ul class="list-disc list-inside space-y-1">
            <li
              v-for="(achievement, index) in story.achievements"
              :key="index"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              {{ achievement }}
            </li>
          </ul>
        </div>

        <!-- KPIs -->
        <div v-if="hasKpis" class="border-t pt-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 mr-2" />
            {{ t('stories.detail.kpis') }}
          </h4>
          <ul class="list-disc list-inside space-y-1">
            <li
              v-for="(kpi, index) in story.kpiSuggestions"
              :key="index"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              {{ kpi }}
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton :label="t('common.actions.close')" @click="close" />
    </template>
  </UModal>
</template>
