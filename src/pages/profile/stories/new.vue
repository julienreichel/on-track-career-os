<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useStoryAutoGenerate } from '@/composables/useStoryAutoGenerate';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';

definePageMeta({
  breadcrumbLabel: 'New Story',
});

const { t } = useI18n();
const router = useRouter();
const { userId } = useAuthUser();

const { generateStories, isGenerating, error } = useStoryAutoGenerate();

const selectedExperienceIds = ref<string[]>([]);
const generationError = computed(() => {
  if (!error.value) return null;
  return error.value === 'common.error' ? t('common.error') : error.value;
});

const hasSelection = computed(() => selectedExperienceIds.value.length > 0);

const handleCancel = () => {
  void router.push('/profile/stories');
};

const handleGenerate = async () => {
  if (!hasSelection.value) return;
  await generateStories(selectedExperienceIds.value);
  if (!error.value) {
    void router.push('/profile/stories');
  }
};
</script>

<template>
  <UPage>
    <UPageHeader :title="t('stories.new.title')" :description="t('stories.new.description')" />

    <UPageBody>
      <UAlert
        v-if="generationError"
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :title="t('common.error')"
        :description="generationError"
        class="mb-6"
      />

      <div v-if="isGenerating" class="space-y-4">
        <ListSkeletonCards />
        <p class="text-center text-sm text-gray-500">
          {{ t('stories.list.generating') }}
        </p>
      </div>

      <UCard v-else>
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ t('stories.new.selectTitle') }}
            </h2>
            <p class="text-gray-600">
              {{ t('stories.new.selectDescription') }}
            </p>
          </div>

          <CvExperiencePicker v-model="selectedExperienceIds" :user-id="userId" />

          <div class="flex justify-end gap-3 pt-4 border-t">
            <UButton color="neutral" variant="outline" @click="handleCancel">
              {{ t('common.actions.cancel') }}
            </UButton>
            <UButton color="primary" :disabled="!hasSelection" @click="handleGenerate">
              {{ t('stories.new.generate') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>
