<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('coverLetter.list.title')"
        :description="t('coverLetter.list.subtitle')"
        :links="[
          {
            label: t('coverLetter.list.actions.create'),
            icon: 'i-heroicons-plus',
            to: { name: 'cover-letters-new' },
          },
        ]"
      />

      <UPageBody>
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="error"
          class="mb-6"
        />

        <div v-if="loading" class="flex flex-col items-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        </div>

        <UEmpty
          v-else-if="items.length === 0"
          :title="t('coverLetter.list.emptyState.title')"
          :description="t('coverLetter.list.emptyState.description')"
          icon="i-heroicons-document-text"
        >
          <template #actions>
            <UButton
              icon="i-heroicons-plus"
              :label="t('coverLetter.list.emptyState.action')"
              :to="{ name: 'cover-letters-new' }"
            />
          </template>
        </UEmpty>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ItemCard
            v-for="letter in items"
            :key="letter.id"
            :title="resolveTitle(letter)"
            :subtitle="resolveSubtitle(letter)"
            @edit="navigateTo({ name: 'cover-letters-id', params: { id: letter.id } })"
            @delete="confirmDelete(letter)"
          >
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p class="line-clamp-3">
                {{ resolvePreview(letter) }}
              </p>
            </div>
          </ItemCard>
        </div>
      </UPageBody>

      <ConfirmModal
        v-model:open="deleteModalOpen"
        :title="t('coverLetter.list.confirmDelete')"
        :description="t('coverLetter.list.confirmDeleteDescription')"
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
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemCard from '@/components/ItemCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useCoverLetters } from '@/application/cover-letter/useCoverLetters';
import type { CoverLetter } from '@/domain/cover-letter/CoverLetter';
import { useAuthUser } from '@/composables/useAuthUser';

const { t } = useI18n();
const toast = useToast();
const { userId, loadUserId } = useAuthUser();
const { items, loading, error, loadAll, deleteCoverLetter } = useCoverLetters();

const deleteModalOpen = ref(false);
const letterToDelete = ref<CoverLetter | null>(null);
const deleting = ref(false);
const TITLE_MAX_LENGTH = 72;
const PREVIEW_MAX_LENGTH = 140;

onMounted(async () => {
  await loadUserId();
  if (!userId.value) {
    return;
  }
  await loadAll({ filter: { userId: { eq: userId.value } } });
});

const confirmDelete = (letter: CoverLetter) => {
  letterToDelete.value = letter;
  deleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!letterToDelete.value) return;
  deleting.value = true;
  try {
    const success = await deleteCoverLetter(letterToDelete.value.id);
    if (success) {
      toast.add({ title: t('coverLetter.list.toast.deleted'), color: 'primary' });
      deleteModalOpen.value = false;
    } else {
      toast.add({ title: t('coverLetter.list.toast.deleteFailed'), color: 'error' });
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
    return t('coverLetter.list.untitled');
  }

  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const firstLine = lines[0] || t('coverLetter.list.untitled');

  if (firstLine.length > TITLE_MAX_LENGTH) {
    return firstLine.substring(0, TITLE_MAX_LENGTH) + '...';
  }
  return firstLine;
};

const resolveSubtitle = (letter: CoverLetter): string => {
  // Show if it's tailored to a specific job
  if (letter.jobId) {
    return t('coverLetter.list.tailored');
  }
  return t('coverLetter.list.generic');
};

const resolvePreview = (letter: CoverLetter): string => {
  const content = letter.content || '';
  if (content.length === 0) {
    return t('coverLetter.list.emptyContent');
  }

  // Get first few lines as preview
  const preview = content.substring(0, PREVIEW_MAX_LENGTH);
  return preview.length < content.length ? preview + '...' : preview;
};
</script>
