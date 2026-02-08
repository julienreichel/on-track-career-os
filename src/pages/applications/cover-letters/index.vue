<template>
  <UPage>
    <UPageHeader
      :title="t('applications.coverLetters.page.title')"
      :description="t('applications.coverLetters.page.description')"
      :links="[
        {
          label: t('common.backToList'),
          icon: 'i-heroicons-arrow-left',
          to: { name: 'applications' },
        },
        {
          label: t('applications.coverLetters.list.actions.create'),
          icon: 'i-heroicons-sparkles',
          to: { name: 'applications-cover-letters-new' },
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
          :placeholder="t('applications.coverLetters.list.search.placeholder')"
          size="lg"
          class="w-1/3"
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
        <UEmpty
          :title="t('applications.coverLetters.list.search.noResults')"
          icon="i-heroicons-magnifying-glass"
        >
          <p class="text-sm text-gray-500">
            {{ t('applications.coverLetters.list.search.placeholder') }}
          </p>
        </UEmpty>
      </UCard>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ItemCard
          v-for="letter in filteredItems"
          :key="letter.id"
          :title="resolveTitle(letter)"
          :subtitle="resolveSubtitle(letter)"
          @edit="navigateTo({ name: 'applications-cover-letters-id', params: { id: letter.id } })"
          @delete="confirmDelete(letter)"
        >
          <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p class="line-clamp-3">
              {{ resolvePreview(letter) }}
            </p>
          </div>

          <!-- Custom Actions -->
          <template #actions>
            <UButton
              :label="$t('common.actions.view')"
              icon="i-heroicons-eye"
              size="xs"
              color="primary"
              variant="outline"
              @click="
                navigateTo({ name: 'applications-cover-letters-id', params: { id: letter.id } })
              "
            />
            <UButton
              :label="$t('common.actions.print')"
              icon="i-heroicons-printer"
              size="xs"
              color="neutral"
              variant="outline"
              @click="handlePrint(letter)"
            />
          </template>
        </ItemCard>
      </div>
    </UPageBody>

    <ConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('applications.coverLetters.delete.title')"
      :description="t('applications.coverLetters.delete.message')"
      :confirm-label="t('common.actions.delete')"
      :cancel-label="t('common.actions.cancel')"
      confirm-color="error"
      :loading="deleting"
      @confirm="handleDelete"
    />
  </UPage>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGuidance } from '@/composables/useGuidance';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import ItemCard from '@/components/ItemCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import EmptyStateActionCard from '@/components/guidance/EmptyStateActionCard.vue';
import LockedFeatureCard from '@/components/guidance/LockedFeatureCard.vue';
import GuidanceBanner from '@/components/guidance/GuidanceBanner.vue';
import { useCoverLetters } from '@/application/cover-letter/useCoverLetters';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import { formatListDate } from '@/utils/formatListDate';

const { t } = useI18n();
const toast = useToast();
const { items, loading, error, loadAll, deleteCoverLetter } = useCoverLetters();
const jobAnalysis = useJobAnalysis();
const guidanceJobId = computed(() => jobAnalysis.jobs.value[0]?.id);
const { guidance } = useGuidance('applications-cover-letters', () => ({
  coverLetterCount: items.value.length,
  jobId: guidanceJobId.value,
}));

const deleteModalOpen = ref(false);
const letterToDelete = ref<CoverLetter | null>(null);
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

  return sortedItems.value.filter((letter) => {
    const fields = [letter.name, letter.content];
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

const confirmDelete = (letter: CoverLetter) => {
  letterToDelete.value = letter;
  deleteModalOpen.value = true;
};

const handlePrint = (letter: CoverLetter) => {
  const printUrl = `/applications/cover-letters/${letter.id}/print`;
  window.open(printUrl, '_blank');
};

const handleDelete = async () => {
  if (!letterToDelete.value) return;
  deleting.value = true;
  try {
    const success = await deleteCoverLetter(letterToDelete.value.id);
    if (success) {
      toast.add({ title: t('applications.coverLetters.toast.deleted'), color: 'primary' });
      deleteModalOpen.value = false;
    } else {
      toast.add({ title: t('applications.coverLetters.toast.deleteFailed'), color: 'error' });
    }
  } finally {
    deleting.value = false;
    letterToDelete.value = null;
  }
};

const resolveTitle = (letter: CoverLetter): string => {
  // Use the name field if available, fallback to content-based title
  if (letter.name?.trim()) {
    return letter.name.length > TITLE_MAX_LENGTH
      ? letter.name.substring(0, TITLE_MAX_LENGTH) + '...'
      : letter.name;
  }

  // Fallback to old logic for letters created before name field
  const content = letter.content || '';
  if (content.length === 0) {
    return t('applications.coverLetters.detail.untitled');
  }

  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const firstLine = lines[0] || t('applications.coverLetters.detail.untitled');

  if (firstLine.length > TITLE_MAX_LENGTH) {
    return firstLine.substring(0, TITLE_MAX_LENGTH) + '...';
  }
  return firstLine;
};

const resolveSubtitle = (letter: CoverLetter): string => {
  const lastUpdated = formatListDate(letter.updatedAt ?? letter.createdAt);
  return lastUpdated;
};

const resolvePreview = (letter: CoverLetter): string => {
  const content = letter.content || '';
  if (content.length === 0) {
    return t('applications.coverLetters.list.empty.content');
  }

  // Get first few lines as preview
  const preview = content.substring(0, PREVIEW_MAX_LENGTH);
  return preview.length < content.length ? preview + '...' : preview;
};
</script>
