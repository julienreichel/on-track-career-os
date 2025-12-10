<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import { STARStoryService } from '@/domain/starstory/STARStoryService';
import type { Experience } from '@/domain/experience/Experience';
import ExperienceList from '@/components/ExperienceList.vue';

const { t } = useI18n();
const router = useRouter();
const experienceRepo = new ExperienceRepository();
const storyService = new STARStoryService();

const experiences = ref<Experience[]>([]);
const storyCounts = ref<Record<string, number>>({});
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const experienceToDelete = ref<string | null>(null);

// Load experiences on mount
onMounted(async () => {
  await loadExperiences();
  await loadStoryCounts();
});

async function loadExperiences() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await experienceRepo.list();
    experiences.value = result || [];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load experiences';
    console.error('[experiences] Error loading experiences:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStoryCounts() {
  // Load story counts for all experiences
  for (const experience of experiences.value) {
    try {
      const stories = await storyService.getStoriesByExperience(experience.id);
      storyCounts.value[experience.id] = stories.length;
    } catch (error) {
      console.error(`[experiences] Error loading stories for ${experience.id}:`, error);
      storyCounts.value[experience.id] = 0;
    }
  }
}

function handleEdit(id: string) {
  if (id) {
    router.push(`/profile/experiences/${id}`);
  } else {
    router.push('/profile/experiences/new');
  }
}

function handleDelete(id: string) {
  experienceToDelete.value = id;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!experienceToDelete.value) return;

  try {
    await experienceRepo.delete(experienceToDelete.value);
    experiences.value = experiences.value.filter((exp) => exp.id !== experienceToDelete.value);
    showDeleteModal.value = false;
    experienceToDelete.value = null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to delete experience';
    console.error('[experiences] Error deleting experience:', error);
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  experienceToDelete.value = null;
}

function handleViewStories(id: string) {
  router.push(`/profile/experiences/${id}/stories`);
}

function handleNewStory(id: string) {
  router.push(`/profile/experiences/${id}/stories/new`);
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('features.experiences.title')"
        :description="t('features.experiences.description')"
        :links="[
          {
            label: t('cvUpload.title'),
            icon: 'i-heroicons-arrow-up-tray',
            to: '/profile/cv-upload',
          },
        ]"
      />

      <UPageBody>
        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="t('cvUpload.errors.unknown')"
          :description="errorMessage"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
          @close="errorMessage = null"
        />

        <!-- Experience List -->
        <experience-list
          :experiences="experiences"
          :story-counts="storyCounts"
          :loading="loading"
          @edit="handleEdit"
          @delete="handleDelete"
          @view-stories="handleViewStories"
          @new-story="handleNewStory"
        />
      </UPageBody>
    </UPage>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" :title="t('experiences.delete.title')">
      <template #body>
        <p>{{ t('experiences.delete.message') }}</p>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('experiences.delete.cancel')"
          @click="cancelDelete"
        />
        <UButton color="error" :label="t('experiences.delete.confirm')" @click="confirmDelete" />
      </template>
    </UModal>
  </UContainer>
</template>
