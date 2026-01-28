<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="$t('cvList.title')"
        :description="$t('cvList.subtitle')"
        :links="[
          {
            label: $t('navigation.backToApplications'),
            icon: 'i-heroicons-arrow-left',
            to: { name: 'applications' },
          },
          {
            label: $t('cvList.actions.settings'),
            icon: 'i-heroicons-cog-6-tooth',
            to: '/settings/cv',
            color: 'neutral',
            variant: 'outline',
          },
          {
            label: $t('cvList.actions.create'),
            icon: 'i-heroicons-plus',
            to: { name: 'applications-cv-new' },
          },
        ]"
      />

      <UPageBody>
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
            :placeholder="t('cvList.search.placeholder')"
            size="lg"
          />
        </div>

        <!-- Error Alert -->
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="$t('common.error')"
          :description="error"
          class="mb-6"
        />

        <!-- Loading State -->
        <ListSkeletonCards v-if="loading || !hasLoaded" />

        <!-- Empty State -->
        <EmptyStateActionCard v-else-if="guidance.emptyState" :empty-state="guidance.emptyState" />

        <!-- CV List -->
        <UCard v-else-if="filteredItems.length === 0 && sortedItems.length !== 0">
          <UEmpty :title="$t('cvList.search.noResults')" icon="i-heroicons-magnifying-glass">
            <p class="text-sm text-gray-500">{{ $t('cvList.search.placeholder') }}</p>
          </UEmpty>
        </UCard>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ItemCard
            v-for="cv in filteredItems"
            :key="cv.id"
            :title="cv.name || $t('cvList.untitled')"
            :subtitle="formatListDate(cv.updatedAt ?? cv.createdAt)"
            @edit="navigateTo({ name: 'applications-cv-id', params: { id: cv.id } })"
            @delete="confirmDelete(cv)"
          >
            <!-- CV Info Content -->
            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div v-if="cv.isTailored" class="flex items-center gap-1">
                <UIcon name="i-heroicons-briefcase" class="flex-shrink-0" />
                <span>{{ $t('cvList.tailored') }}</span>
              </div>
            </div>

            <!-- Custom Actions -->
            <template #actions>
              <UButton
                :label="$t('common.view')"
                icon="i-heroicons-eye"
                size="xs"
                color="primary"
                variant="outline"
                @click="navigateTo({ name: 'applications-cv-id', params: { id: cv.id } })"
              />
              <UButton
                :label="$t('cvList.actions.print')"
                icon="i-heroicons-printer"
                size="xs"
                color="neutral"
                variant="outline"
                @click="handlePrint(cv)"
              />
            </template>
          </ItemCard>
        </div>
      </UPageBody>

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-model:open="deleteModalOpen"
        :title="t('cvList.confirmDelete', { name: cvToDelete?.name || t('cvList.untitled') })"
        :description="t('cvList.confirmDeleteDescription')"
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
import { useCvDocuments } from '@/composables/useCvDocuments';
import { useGuidance } from '@/composables/useGuidance';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import EmptyStateActionCard from '@/components/guidance/EmptyStateActionCard.vue';
import LockedFeatureCard from '@/components/guidance/LockedFeatureCard.vue';
import { formatListDate } from '@/utils/formatListDate';

const { t } = useI18n();
const toast = useToast();

const { items, loading, error, loadAll, deleteDocument } = useCvDocuments();
const { guidance } = useGuidance('applications-cv', () => ({
  cvCount: items.value.length,
}));
const searchQuery = ref('');
const hasLoaded = ref(false);

const deleteModalOpen = ref(false);
const cvToDelete = ref<CVDocument | null>(null);
const deleting = ref(false);

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

  return sortedItems.value.filter((cv) => {
    const fields = [cv.name, cv.content];
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

const confirmDelete = (cv: CVDocument) => {
  cvToDelete.value = cv;
  deleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!cvToDelete.value) return;

  deleting.value = true;
  try {
    const success = await deleteDocument(cvToDelete.value.id);
    if (success) {
      toast.add({
        title: t('cvList.toast.deleted'),
        color: 'primary',
      });
      deleteModalOpen.value = false;
    } else {
      toast.add({
        title: t('cvList.toast.deleteFailed'),
        color: 'error',
      });
    }
  } finally {
    deleting.value = false;
    cvToDelete.value = null;
  }
};

const handlePrint = (cv: CVDocument) => {
  const printUrl = `/applications/cv/${cv.id}/print`;
  window.open(printUrl, '_blank');
};
</script>
