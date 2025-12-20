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

const headerTitle = computed(
  () =>
    props.story.title?.trim() ||
    props.experienceName ||
    props.companyName ||
    t('storyCard.noTitle')
);

const subtitle = computed(() => {
  if (props.experienceName && props.companyName && props.experienceName !== props.companyName) {
    return `${props.experienceName} · ${props.companyName}`;
  }
  return props.experienceName || props.companyName;
});

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

const handleEdit = () => {
  emit('edit', props.story);
};

const handleDelete = () => {
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
  <ItemCard :title="headerTitle" :subtitle="subtitle" @edit="handleEdit" @delete="handleDelete">
    <!-- Preview Text Content -->
    <div class="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
      {{ preview }}
    </div>

    <!-- Badges -->
    <template #badges>
      <UBadge v-if="hasAchievements" color="primary" variant="subtle" size="xs">
        <UIcon name="i-heroicons-trophy" class="w-3 h-3 mr-1" />
        {{ achievementCount }}
      </UBadge>
      <UBadge v-if="hasKpis" color="primary" variant="subtle" size="xs">
        <UIcon name="i-heroicons-chart-bar" class="w-3 h-3 mr-1" />
        {{ kpiCount }}
      </UBadge>
    </template>

    <!-- Custom Actions -->
    <template #actions>
      <UButton
        :label="t('common.view')"
        icon="i-heroicons-eye"
        size="xs"
        color="neutral"
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
    </template>
  </ItemCard>

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
      <UButton :label="t('common.cancel')" color="neutral" variant="soft" @click="cancelDelete" />
      <UButton :label="t('common.delete')" color="error" @click="confirmDelete" />
    </template>
  </UModal>
</template>
