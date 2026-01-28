<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('speech.list.title')"
        :description="t('speech.list.subtitle')"
        :links="[
          {
            label: t('navigation.backToApplications'),
            icon: 'i-heroicons-arrow-left',
            to: { name: 'applications' },
          },
          {
            label: t('speech.list.actions.create'),
            icon: 'i-heroicons-plus',
            to: { name: 'applications-speech-new' },
          },
        ]"
      />

      <UPageBody>
        <GuidanceBanner v-if="guidance.banner" :banner="guidance.banner" class="mb-6" />

        <LockedFeatureCard
          v-for="feature in guidance.lockedFeatures"
          :key="feature.id"
          :feature="feature"
          class="mb-6"
        />

        <div v-if="hasLoaded && !loading && items.length > 0" class="mb-6">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            :placeholder="t('speech.list.search.placeholder')"
            size="lg"
          />
        </div>

        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="error"
          class="mb-6"
        />

        <ListSkeletonCards v-if="loading || !hasLoaded" />

        <EmptyStateActionCard v-else-if="guidance.emptyState" :empty-state="guidance.emptyState" />

        <UCard v-else-if="filteredItems.length === 0 && sortedItems.length !== 0">
          <UEmpty :title="t('speech.list.search.noResults')" icon="i-heroicons-magnifying-glass">
            <p class="text-sm text-gray-500">{{ t('speech.list.search.placeholder') }}</p>
          </UEmpty>
        </UCard>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ItemCard
            v-for="block in filteredItems"
            :key="block.id"
            :title="resolveTitle(block)"
            :subtitle="formatUpdatedAt(block.updatedAt)"
            @edit="navigateTo({ name: 'applications-speech-id', params: { id: block.id } })"
            @delete="confirmDelete(block)"
          >
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p class="line-clamp-3">
                {{ resolvePreview(block) }}
              </p>
            </div>

            <template #actions>
              <UButton
                :label="t('common.view')"
                icon="i-heroicons-eye"
                size="xs"
                color="primary"
                variant="outline"
                @click="navigateTo({ name: 'applications-speech-id', params: { id: block.id } })"
              />
            </template>
          </ItemCard>
        </div>
      </UPageBody>

      <ConfirmModal
        v-model:open="deleteModalOpen"
        :title="t('speech.list.confirmDelete')"
        :description="t('speech.list.confirmDeleteDescription')"
        :confirm-label="t('common.delete')"
        :cancel-label="t('common.cancel')"
        confirm-color="error"
        :loading="deleting"
        @confirm="handleDelete"
      />
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGuidance } from '@/composables/useGuidance';
import ItemCard from '@/components/ItemCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import LockedFeatureCard from '@/components/guidance/LockedFeatureCard.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';
import EmptyStateActionCard from '@/components/guidance/EmptyStateActionCard.vue';
import { useSpeechBlocks } from '@/application/speech-block/useSpeechBlocks';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import { formatListDate } from '@/utils/formatListDate';

const { t } = useI18n();
const toast = useToast();
const { items, loading, error, loadAll, deleteSpeechBlock } = useSpeechBlocks();
const { guidance } = useGuidance('applications-speech', () => ({
  speechCount: items.value.length,
}));

const deleteModalOpen = ref(false);
const speechToDelete = ref<SpeechBlock | null>(null);
const deleting = ref(false);
const searchQuery = ref('');
const hasLoaded = ref(false);
const TITLE_MAX_LENGTH = 72;
const PREVIEW_MAX_LENGTH = 140;
const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortedItems = computed(() =>
  [...items.value].sort((a, b) => {
    const aTime = toTimestamp(a.updatedAt ?? a.createdAt);
    const bTime = toTimestamp(b.updatedAt ?? b.createdAt);
    return bTime - aTime;
  })
);

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return sortedItems.value;

  return sortedItems.value.filter((block) => {
    const fields = [block.name, block.elevatorPitch, block.careerStory, block.whyMe];
    return fields.some((field) => field?.toLowerCase().includes(query));
  });
});

onMounted(async () => {
  hasLoaded.value = false;
  try {
    await loadAll();
  } finally {
    hasLoaded.value = true;
  }
});

const confirmDelete = (block: SpeechBlock) => {
  speechToDelete.value = block;
  deleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!speechToDelete.value) return;
  deleting.value = true;
  try {
    const success = await deleteSpeechBlock(speechToDelete.value.id);
    if (success) {
      toast.add({ title: t('speech.list.toast.deleted'), color: 'primary' });
      deleteModalOpen.value = false;
    } else {
      toast.add({ title: t('speech.list.toast.deleteFailed'), color: 'error' });
    }
  } finally {
    deleting.value = false;
    speechToDelete.value = null;
  }
};

const resolveTitle = (block: SpeechBlock) => {
  const raw =
    block.name?.trim() ||
    block.elevatorPitch?.trim() ||
    block.careerStory?.trim() ||
    block.whyMe?.trim() ||
    '';
  if (!raw) {
    return t('speech.list.untitled');
  }
  return raw.length > TITLE_MAX_LENGTH ? `${raw.slice(0, TITLE_MAX_LENGTH)}...` : raw;
};

const resolvePreview = (block: SpeechBlock) => {
  const raw = block.careerStory?.trim() || block.elevatorPitch?.trim() || block.whyMe?.trim() || '';
  if (!raw) {
    return t('speech.list.emptyPreview');
  }
  return raw.length > PREVIEW_MAX_LENGTH ? `${raw.slice(0, PREVIEW_MAX_LENGTH)}...` : raw;
};

const formatUpdatedAt = (date?: string | null) => {
  return formatListDate(date);
};
</script>
