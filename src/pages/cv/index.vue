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
            label: $t('cvList.actions.create'),
            icon: 'i-heroicons-plus',
            to: { name: 'cv-new' },
          },
        ]"
      />

      <UPageBody>
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
        <div v-if="loading" class="flex flex-col items-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        </div>

        <!-- Empty State -->
        <UEmpty
          v-else-if="items.length === 0"
          :title="$t('cvList.emptyState.title')"
          :description="$t('cvList.emptyState.description')"
          icon="i-heroicons-document-text"
        >
          <template #actions>
            <UButton icon="i-heroicons-plus" :to="{ name: 'cv-new' }">
              {{ $t('cvList.emptyState.action') }}
            </UButton>
          </template>
        </UEmpty>

        <!-- CV List -->
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ItemCard
            v-for="cv in sortedItems"
            :key="cv.id"
            :title="cv.name || $t('cvList.untitled')"
            @edit="navigateTo({ name: 'cv-id', params: { id: cv.id } })"
            @delete="confirmDelete(cv)"
          >
            <!-- CV Info Content -->
            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div v-if="cv.isTailored" class="flex items-center gap-1">
                <UIcon name="i-heroicons-briefcase" class="flex-shrink-0" />
                <span>{{ $t('cvList.tailored') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-calendar" class="flex-shrink-0" />
                <span>{{ $t('cvList.updated') }}: {{ formatDate(cv.updatedAt) }}</span>
              </div>
            </div>

            <!-- Custom Actions -->
            <template #actions>
              <UButton
                :label="$t('cvList.actions.print')"
                icon="i-heroicons-printer"
                size="xs"
                color="neutral"
                variant="soft"
                @click="handlePrint(cv)"
              />
              <UButton
                :label="$t('common.edit')"
                icon="i-heroicons-pencil"
                size="xs"
                color="primary"
                variant="soft"
                @click="navigateTo({ name: 'cv-id', params: { id: cv.id } })"
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
        confirm-color="red"
        :loading="deleting"
        @confirm="handleDelete"
      />
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useCvDocuments } from '@/composables/useCvDocuments';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

const { t } = useI18n();
const toast = useToast();

const { items, loading, error, loadAll, deleteDocument } = useCvDocuments();

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

onMounted(() => {
  loadAll();
});

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

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
  const printUrl = `/cv/${cv.id}/print`;
  window.open(printUrl, '_blank');
};
</script>
