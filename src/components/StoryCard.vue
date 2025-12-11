<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { STARStory } from '@/domain/starstory/STARStory';

const props = defineProps<{
  story: STARStory;
  experienceName?: string;
  companyName?: string;
}>();

const emit = defineEmits<{
  view: [story: STARStory];
  edit: [story: STARStory];
  delete: [story: STARStory];
}>();

const { t } = useI18n();

const showDeleteConfirm = ref(false);

const preview = computed(() => {
  const maxLength = 120;
  const text = props.story.situation || props.story.task || t('storyCard.noContent');
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
});

const hasAchievements = computed(() => (props.story.achievements?.length || 0) > 0);
const hasKpis = computed(() => (props.story.kpiSuggestions?.length || 0) > 0);
const achievementCount = computed(() => props.story.achievements?.length || 0);
const kpiCount = computed(() => props.story.kpiSuggestions?.length || 0);

const handleView = (event: Event) => {
  event.stopPropagation();
  emit('view', props.story);
};

const handleEdit = (event: Event) => {
  event.stopPropagation();
  emit('edit', props.story);
};

const handleDelete = (event: Event) => {
  event.stopPropagation();
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  showDeleteConfirm.value = false;
  emit('delete', props.story);
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="space-y-2">
        <!-- Company/Experience Name -->
        <div
          v-if="companyName || experienceName"
          class="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ companyName || experienceName }}
        </div>
      </div>
    </template>

    <!-- Preview Text - grows to fill space -->
    <div class="text-sm text-gray-700 dark:text-gray-300 flex-grow line-clamp-4">
      {{ preview }}
    </div>

    <template #footer>
      <div class="space-y-3">
        <!-- Badges Row -->
        <div class="flex items-center gap-2">
          <UBadge v-if="hasAchievements" color="primary" variant="subtle" size="xs">
            <UIcon name="i-heroicons-trophy" class="w-3 h-3 mr-1" />
            {{ achievementCount }}
          </UBadge>
          <UBadge v-if="hasKpis" color="green" variant="subtle" size="xs">
            <UIcon name="i-heroicons-chart-bar" class="w-3 h-3 mr-1" />
            {{ kpiCount }}
          </UBadge>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex gap-2">
            <UButton
              :label="t('common.view')"
              icon="i-heroicons-eye"
              size="xs"
              color="gray"
              variant="soft"
              @click="handleView"
            />
            <UButton
              :label="t('common.edit')"
              icon="i-heroicons-pencil"
              size="xs"
              color="primary"
              variant="soft"
              @click="handleEdit"
            />
          </div>
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="red"
            variant="ghost"
            @click="handleDelete"
          />
        </div>
      </div>
    </template>
  </UCard>

  <!-- Delete Confirmation Modal -->
  <UModal
    v-model:open="showDeleteConfirm"
    :title="t('storyCard.deleteConfirm.title')"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('storyCard.deleteConfirm.message') }}
      </p>
    </template>

    <template #footer>
      <UButton :label="t('common.cancel')" color="gray" variant="soft" @click="cancelDelete" />
      <UButton :label="t('common.delete')" color="red" @click="confirmDelete" />
    </template>
  </UModal>
</template>
