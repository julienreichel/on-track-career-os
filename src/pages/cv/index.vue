<template>
  <UPage>
    <UPageHeader :title="$t('cvList.title')" :description="$t('cvList.subtitle')">
      <template #actions>
        <UButton icon="i-heroicons-plus" :to="{ name: 'cv-new' }">
          {{ $t('cvList.actions.create') }}
        </UButton>
      </template>
    </UPageHeader>

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
      <UCard v-if="loading">
        <USkeleton class="h-8 w-full" />
      </UCard>

      <!-- Empty State -->
      <UCard v-else-if="items.length === 0">
        <UEmpty
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
      </UCard>

      <!-- CV List -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="cv in items"
          :key="cv.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo({ name: 'cv-id', params: { id: cv.id } })"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
                {{ cv.name || $t('cvList.untitled') }}
              </h3>
              <UDropdownMenu :items="getActions(cv)">
                <UButton
                  icon="i-heroicons-ellipsis-vertical"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click.stop
                />
              </UDropdownMenu>
            </div>

            <div class="space-y-1 text-sm text-gray-600">
              <div v-if="cv.isTailored" class="flex items-center gap-1">
                <UIcon name="i-heroicons-briefcase" class="flex-shrink-0" />
                <span>{{ $t('cvList.tailored') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-calendar" class="flex-shrink-0" />
                <span>{{ $t('cvList.updated') }}: {{ formatDate(cv.updatedAt) }}</span>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-200">
              <UButton
                block
                color="neutral"
                variant="outline"
                size="sm"
                @click.stop="navigateTo({ name: 'cv-id', params: { id: cv.id } })"
              >
                {{ $t('cvList.actions.edit') }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCvDocuments } from '@/composables/useCvDocuments';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

const { t } = useI18n();
const toast = useToast();

const { items, loading, error, loadAll, deleteDocument } = useCvDocuments();

onMounted(() => {
  loadAll();
});

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

const getActions = (cv: CVDocument) => [
  [
    {
      label: t('cvList.actions.duplicate'),
      icon: 'i-heroicons-document-duplicate',
      click: () => duplicateCV(cv),
    },
    {
      label: t('cvList.actions.download'),
      icon: 'i-heroicons-arrow-down-tray',
      click: () => downloadCV(cv),
    },
  ],
  [
    {
      label: t('cvList.actions.delete'),
      icon: 'i-heroicons-trash',
      click: () => confirmDelete(cv),
    },
  ],
];

const duplicateCV = async (_cv: CVDocument) => {
  // TODO: Implement duplication logic
  toast.add({
    title: t('cvList.toast.duplicateNotImplemented'),
    color: 'warning',
  });
};

const downloadCV = async (_cv: CVDocument) => {
  // TODO: Implement PDF download
  toast.add({
    title: t('cvList.toast.downloadNotImplemented'),
    color: 'warning',
  });
};

const confirmDelete = async (cv: CVDocument) => {
  if (confirm(t('cvList.confirmDelete', { name: cv.name || t('cvList.untitled') }))) {
    const success = await deleteDocument(cv.id);
    if (success) {
      toast.add({
        title: t('cvList.toast.deleted'),
        color: 'primary',
      });
    } else {
      toast.add({
        title: t('cvList.toast.deleteFailed'),
        color: 'error',
      });
    }
  }
};
</script>
