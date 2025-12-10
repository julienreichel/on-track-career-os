<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { STARStory } from '@/domain/starstory/STARStory';

const props = defineProps<{
  story: STARStory;
  experienceName?: string;
}>();

const emit = defineEmits<{
  click: [story: STARStory];
}>();

const { t } = useI18n();

const preview = computed(() => {
  const maxLength = 150;
  const text = props.story.situation || props.story.task || t('storyCard.noContent');
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
});

const hasAchievements = computed(() => (props.story.achievements?.length || 0) > 0);
const hasKpis = computed(() => (props.story.kpiSuggestions?.length || 0) > 0);
const achievementCount = computed(() => props.story.achievements?.length || 0);
const kpiCount = computed(() => props.story.kpiSuggestions?.length || 0);

const handleClick = () => {
  emit('click', props.story);
};
</script>

<template>
  <UCard class="cursor-pointer hover:shadow-lg transition-shadow" @click="handleClick">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div v-if="experienceName" class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {{ experienceName }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UBadge v-if="hasAchievements" color="primary" variant="subtle">
            <UIcon name="i-heroicons-trophy" class="w-3 h-3 mr-1" />
            {{ achievementCount }}
          </UBadge>
          <UBadge v-if="hasKpis" color="green" variant="subtle">
            <UIcon name="i-heroicons-chart-bar" class="w-3 h-3 mr-1" />
            {{ kpiCount }}
          </UBadge>
        </div>
      </div>
    </template>

    <div class="text-sm text-gray-700 dark:text-gray-300">
      {{ preview }}
    </div>

    <template #footer>
      <div class="text-xs text-gray-500 dark:text-gray-400">
        {{ t('storyCard.clickToView') }}
      </div>
    </template>
  </UCard>
</template>
