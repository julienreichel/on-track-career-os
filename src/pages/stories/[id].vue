<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStoryEditor } from '@/composables/useStoryEditor';
import { useStoryEnhancer } from '@/composables/useStoryEnhancer';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const storyId = route.params.id as string;

const {
  story,
  formState,
  isDirty,
  loading,
  saving,
  deleting,
  error,
  canSave,
  load,
  save,
  deleteStory,
  discard,
} = useStoryEditor(storyId);

const {
  achievements,
  kpiSuggestions,
  generating,
  generate,
  load: loadEnhancements,
} = useStoryEnhancer();

const showDeleteConfirm = ref(false);

onMounted(async () => {
  if (storyId) {
    await load(storyId);
    if (story.value) {
      // Load existing achievements/KPIs
      loadEnhancements({
        achievements: story.value.achievements || [],
        kpiSuggestions: story.value.kpiSuggestions || [],
      });
    }
  }
});

// Sync achievements back to form state
watch([achievements, kpiSuggestions], () => {
  formState.value.achievements = achievements.value;
  formState.value.kpiSuggestions = kpiSuggestions.value;
});

const handleGenerateEnhancements = async () => {
  await generate(formState.value);
};

const handleSave = async () => {
  const saved = await save();
  if (saved) {
    router.push('/stories');
  }
};

const handleDelete = async () => {
  const success = await deleteStory();
  if (success) {
    router.push('/stories');
  }
  showDeleteConfirm.value = false;
};

const handleDiscard = async () => {
  await discard();
};
</script>

<template>
  <UContainer>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <USkeleton class="h-96 w-full" />
    </div>

    <!-- Error State -->
    <div v-else-if="error && !story">
      <UPageHeader
        :title="t('stories.builder.notFound')"
        :description="t('stories.builder.notFoundDescription')"
      >
        <template #actions>
          <UButton :label="t('stories.list.addNew')" icon="i-heroicons-plus" to="/stories/new" />
        </template>
      </UPageHeader>
    </div>

    <!-- Editor -->
    <div v-else>
      <UPageHeader
        :title="t('storyEditor.title')"
        :description="story?.experienceId || t('storyEditor.backToList')"
      >
        <template #actions>
          <div class="flex gap-2">
            <UButton
              variant="ghost"
              icon="i-heroicons-arrow-left"
              :label="t('storyEditor.backToList')"
              to="/stories"
            />
            <UButton
              v-if="isDirty"
              variant="outline"
              :label="t('storyEditor.discard')"
              @click="handleDiscard"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              :label="t('storyEditor.delete')"
              :loading="deleting"
              @click="showDeleteConfirm = true"
            />
            <UButton
              :label="t('storyEditor.save')"
              icon="i-heroicons-check"
              :loading="saving"
              :disabled="!canSave"
              @click="handleSave"
            />
          </div>
        </template>
      </UPageHeader>

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="error"
          color="red"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="error"
          class="mb-6"
        />

        <!-- Story Form -->
        <UCard class="mb-6">
          <StoryForm v-model="formState" :disabled="saving || loading" />
        </UCard>

        <!-- Achievements & KPIs -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">{{ t('enhancer.title') }}</h3>
              <UButton
                variant="outline"
                size="sm"
                icon="i-heroicons-sparkles"
                :label="t('storyEditor.generateEnhancements')"
                :loading="generating"
                @click="handleGenerateEnhancements"
              />
            </div>
          </template>

          <AchievementsKpisPanel
            v-model:achievements="achievements"
            v-model:kpis="kpiSuggestions"
            :generating="generating"
            @regenerate="handleGenerateEnhancements"
          />
        </UCard>
      </UPageBody>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ t('stories.delete.title') }}</h3>
        </template>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('stories.delete.message') }}
        </p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              :label="t('common.cancel')"
              @click="showDeleteConfirm = false"
            />
            <UButton
              color="red"
              :label="t('common.delete')"
              :loading="deleting"
              @click="handleDelete"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>
