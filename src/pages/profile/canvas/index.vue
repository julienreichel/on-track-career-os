<template>
  <UPage>
    <UPageHeader
      :title="t('canvas.page.title')"
      :description="t('canvas.page.description')"
      :links="headerLinks"
    />

    <UPageBody>
      <!-- Error Alert -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="t('canvas.messages.error')"
        :description="error"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
        @close="error = null"
      />

      <LockedFeatureCard
        v-for="feature in guidance.lockedFeatures"
        :key="feature.id"
        :feature="feature"
        class="mb-6"
      />

      <PersonalCanvasComponent
        v-if="!guidance.lockedFeatures?.length"
        :canvas="canvas"
        :loading="loading"
        @generate="handleGenerate"
        @regenerate="handleRegenerate"
        @save="handleSave"
      />
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useCanvasEngine } from '@/application/personal-canvas/useCanvasEngine';
import { useAuthUser } from '@/composables/useAuthUser';
import { useGuidance } from '@/composables/useGuidance';
import type { PersonalCanvas } from '@/domain/personal-canvas/PersonalCanvas';
import type { PageHeaderLink } from '@/types/ui';
import LockedFeatureCard from '@/components/guidance/LockedFeatureCard.vue';

definePageMeta({
  breadcrumbLabel: 'Canvas',
});

const { t } = useI18n();
const toast = useToast();
const { userId } = useAuthUser();
const { canvas, loading, error, initializeForUser, generateAndSave, regenerateAndSave, saveEdits } =
  useCanvasEngine();
const { guidance } = useGuidance('profile-canvas', () => ({
  canvasCount: canvas.value ? 1 : 0,
}));

const headerLinks = computed<PageHeaderLink[]>(() => [
  {
    label: t('common.backToProfile'),
    icon: 'i-heroicons-arrow-left',
    to: '/profile',
  },
]);

// Initialize canvas engine when userId is available
watch(
  userId,
  async (newUserId) => {
    if (newUserId) {
      await initializeForUser(newUserId);
    }
  },
  { immediate: true }
);

const handleGenerate = async () => {
  const success = await generateAndSave();

  if (success) {
    toast.add({
      title: t('canvas.messages.generated'),
      icon: 'i-heroicons-check-circle',
      color: 'success',
    });
  } else if (error.value) {
    // Error already set by composable
  } else {
    error.value = t('errors.unknown');
  }
};

const handleRegenerate = async () => {
  const success = await regenerateAndSave();

  if (success) {
    toast.add({
      title: t('canvas.messages.regenerated'),
      icon: 'i-heroicons-check-circle',
      color: 'success',
    });
  } else if (error.value) {
    // Error already set by composable
  } else {
    error.value = t('errors.unknown');
  }
};

const handleSave = async (updates: Partial<PersonalCanvas>) => {
  const success = await saveEdits(updates);

  if (success) {
    toast.add({
      title: t('canvas.messages.saved'),
      icon: 'i-heroicons-check-circle',
      color: 'success',
    });
  } else if (error.value) {
    // Error already set by composable
  } else {
    error.value = t('errors.unknown');
  }
};
</script>
