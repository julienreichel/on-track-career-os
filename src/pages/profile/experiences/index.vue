<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import ExperienceList from '@/components/ExperienceList.vue';

const { t } = useI18n();
const router = useRouter();
const experienceRepo = new ExperienceRepository();

const experiences = ref<Experience[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const showDeleteModal = ref(false);
const experienceToDelete = ref<string | null>(null);

// Load experiences on mount
onMounted(async () => {
  await loadExperiences();
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
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('features.experiences.title')"
        :description="t('features.experiences.description')"
      >
        <template #actions>
          <UButton
            :label="t('cvUpload.title')"
            icon="i-heroicons-arrow-up-tray"
            to="/profile/cv-upload"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <div class="space-y-6">
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
            :loading="loading"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </UPageBody>
    </UPage>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ t('experiences.delete.title') }}</h3>
        </template>

        <p>{{ t('experiences.delete.message') }}</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :label="t('experiences.delete.cancel')"
              @click="cancelDelete"
            />
            <UButton
              color="error"
              :label="t('experiences.delete.confirm')"
              @click="confirmDelete"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>
