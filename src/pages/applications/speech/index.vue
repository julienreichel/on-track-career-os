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
            onClick: handleCreate,
            disabled: creating,
            loading: creating,
          },
        ]"
      />

      <UPageBody>
        <div v-if="!loading && items.length > 0" class="mb-6">
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

        <div v-if="loading" class="flex flex-col items-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary mb-4" />
        </div>

        <UEmpty
          v-else-if="items.length === 0"
          :title="t('speech.list.emptyState.title')"
          :description="t('speech.list.emptyState.description')"
          icon="i-heroicons-chat-bubble-left-right"
        >
          <template #actions>
            <UButton
              icon="i-heroicons-plus"
              :label="t('speech.list.emptyState.action')"
              :loading="creating"
              :disabled="creating"
              @click="handleCreate"
            />
          </template>
        </UEmpty>

        <UCard v-else-if="filteredItems.length === 0">
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
import ItemCard from '@/components/ItemCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useSpeechBlocks } from '@/application/speech-block/useSpeechBlocks';
import { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import type { SpeechBlock } from '@/domain/speech-block/SpeechBlock';
import { useAuthUser } from '@/composables/useAuthUser';
import { useSpeechEngine } from '@/composables/useSpeechEngine';

const { t } = useI18n();
const toast = useToast();
const { userId, loadUserId } = useAuthUser();
const { items, loading, error, loadAll, deleteSpeechBlock, createSpeechBlock } = useSpeechBlocks();
const service = new SpeechBlockService();
const engine = useSpeechEngine();

const deleteModalOpen = ref(false);
const speechToDelete = ref<SpeechBlock | null>(null);
const deleting = ref(false);
const creating = ref(false);
const searchQuery = ref('');
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
  await loadUserId();
  if (!userId.value) {
    return;
  }
  await loadAll({ filter: { userId: { eq: userId.value } } });
});

const handleCreate = async () => {
  if (creating.value) return;
  creating.value = true;
  try {
    if (!userId.value) {
      await loadUserId();
    }
    if (!userId.value) {
      throw new Error(t('speech.list.toast.createFailed'));
    }
    const result = await engine.generate();
    const draft = service.createDraftSpeechBlock(userId.value);
    const created = await createSpeechBlock({
      ...draft,
      elevatorPitch: result.elevatorPitch ?? '',
      careerStory: result.careerStory ?? '',
      whyMe: result.whyMe ?? '',
    });
    if (created?.id) {
      await navigateTo({ name: 'applications-speech-id', params: { id: created.id } });
    } else {
      toast.add({ title: t('speech.list.toast.createFailed'), color: 'error' });
    }
  } catch (err) {
    console.error('[speechList] Failed to create speech block', err);
    const toastKey = engine.error.value
      ? 'speech.list.toast.generateFailed'
      : 'speech.list.toast.createFailed';
    toast.add({ title: t(toastKey), color: 'error' });
  } finally {
    creating.value = false;
  }
};

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
  if (!date) {
    return t('speech.list.updatedUnknown');
  }
  return t('speech.list.updated', { date: new Date(date).toLocaleDateString() });
};
</script>
