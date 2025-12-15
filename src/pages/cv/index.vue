<template>
  <div class="cv-list-page">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          {{ $t('cvList.title') }}
        </h1>
        <p class="mt-2 text-gray-600">
          {{ $t('cvList.subtitle') }}
        </p>
      </div>

      <!-- Actions -->
      <div class="mb-6">
        <UButton icon="i-heroicons-plus" size="lg" :to="{ name: 'cv-new' }">
          {{ $t('cvList.actions.create') }}
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-red-500 mx-auto mb-4" />
        <p class="text-gray-700">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="text-6xl text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          {{ $t('cvList.emptyState.title') }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{ $t('cvList.emptyState.description') }}
        </p>
        <UButton icon="i-heroicons-plus" size="lg" :to="{ name: 'cv-new' }">
          {{ $t('cvList.emptyState.action') }}
        </UButton>
      </div>

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
              <UDropdown :items="getActions(cv)">
                <UButton
                  icon="i-heroicons-ellipsis-vertical"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click.stop
                />
              </UDropdown>
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
    </div>
  </div>
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
