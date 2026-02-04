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
    props.story.title?.trim() || props.experienceName || props.companyName || t('stories.card.noTitle')
);

const subtitle = computed(() => {
  if (props.experienceName && props.companyName && props.experienceName !== props.companyName) {
    return `${props.experienceName} · ${props.companyName}`;
  }
  return props.experienceName || props.companyName;
});

const preview = computed(() => {
  const maxLength = 120;
  const text = props.story.situation || props.story.task || t('stories.card.noContent');
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
      <UBadge
        v-if="hasAchievements"
        color="secondary"
        variant="outline"
        size="xs"
        icon="i-heroicons-trophy"
      >
        {{ achievementCount }}
      </UBadge>
      <UBadge
        v-if="hasKpis"
        color="secondary"
        variant="outline"
        size="xs"
        icon="i-heroicons-chart-bar"
      >
        {{ kpiCount }}
      </UBadge>
    </template>

    <!-- Custom Actions -->
    <template #actions>
      <UButton
        :label="t('common.actions.view')"
        icon="i-heroicons-eye"
        size="xs"
        color="primary"
        variant="outline"
        class="cursor-pointer"
        @click="handleView"
      />
      <UButton
        :label="t('common.actions.edit')"
        icon="i-heroicons-pencil"
        size="xs"
        color="neutral"
        variant="outline"
        class="cursor-pointer"
        @click="handleEdit"
      />
    </template>
  </ItemCard>

  <!-- Delete Confirmation Modal -->
  <UModal
    v-model:open="showDeleteConfirm"
    :title="t('stories.card.deleteConfirm.title')"
    :description="t('stories.card.deleteConfirm.message')"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        :label="t('common.actions.cancel')"
        color="neutral"
        variant="ghost"
        class="cursor-pointer"
        @click="cancelDelete"
      />
      <UButton :label="t('common.actions.delete')" color="error" @click="confirmDelete" />
    </template>
  </UModal>
</template>
