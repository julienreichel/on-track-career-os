<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience, ExperienceCreateInput } from '@/domain/experience/Experience';
import ExperienceForm from '@/components/ExperienceForm.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const experienceRepo = new ExperienceRepository();

const experience = ref<Experience | null>(null);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const experienceId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? id : null;
});

const isNewExperience = computed(() => experienceId.value === 'new' || !experienceId.value);

// Update page meta with company name for breadcrumb
watch(
  () => experience.value,
  (exp) => {
    if (exp?.companyName) {
      // Update route meta for breadcrumb
      route.meta.breadcrumbLabel = exp.companyName;
    } else if (isNewExperience.value) {
      route.meta.breadcrumbLabel = t('navigation.new');
    }
  },
  { immediate: true }
);

// Load experience if editing
onMounted(async () => {
  if (!isNewExperience.value && experienceId.value) {
    await loadExperience(experienceId.value);
  } else if (isNewExperience.value) {
    route.meta.breadcrumbLabel = t('navigation.new');
  }
});

async function loadExperience(id: string) {
  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await experienceRepo.get(id);
    if (!result) {
      throw new Error('Experience not found');
    }
    experience.value = result;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load experience';
    console.error('[experience] Error loading experience:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSave(data: ExperienceCreateInput) {
  saving.value = true;
  errorMessage.value = null;

  try {
    // Get current user ID
    const user = useNuxtApp().$Amplify.Auth.getCurrentUser();
    const userId = (await user).userId;

    if (isNewExperience.value) {
      // Create new experience
      await experienceRepo.create({
        ...data,
        userId,
      });
    } else if (experienceId.value) {
      // Update existing experience
      await experienceRepo.update({
        id: experienceId.value,
        ...data,
      });
    }

    // Navigate back to list
    router.push('/profile/experiences');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save experience';
    console.error('[experience] Error saving experience:', error);
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push('/profile/experiences');
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="
          isNewExperience ? t('experiences.form.createTitle') : t('experiences.form.editTitle')
        "
        :links="[
          {
            label: t('experiences.list.title'),
            icon: 'i-heroicons-arrow-left',
            to: '/profile/experiences',
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

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary" />
        </div>

        <!-- Experience Form -->
        <ExperienceForm
          v-else
          :experience="experience"
          :loading="saving"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
