<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import { getDefaultCvSettings } from '@/domain/cvsettings/getDefaultCvSettings';
import CvSettingsForm, { type CvSettingsFormState } from '@/components/cv/CvSettingsForm.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
defineOptions({ name: 'CvSettingsPage' });

const { t } = useI18n();
const toast = useToast();
const { userId, loadUserId } = useAuthUser();
const experienceRepo = new ExperienceRepository();

const {
  settings,
  loading: settingsLoading,
  error: settingsError,
  load,
  saveSettings,
} = useCvSettings();
const { templates, loading: templatesLoading, load: loadTemplates } = useCvTemplates();

const experiences = ref<Experience[]>([]);
const loadingExperiences = ref(false);
const saving = ref(false);
const hasLoaded = ref(false);
const formState = ref<CvSettingsFormState | null>(null);
const initialized = ref(false);

const isLoading = computed(
  () => settingsLoading.value || templatesLoading.value || loadingExperiences.value
);

const loadExperiences = async (ownerId: string) => {
  loadingExperiences.value = true;
  try {
    experiences.value = await experienceRepo.list(ownerId);
  } catch (error) {
    console.error('[cvSettings] Failed to load experiences:', error);
  } finally {
    loadingExperiences.value = false;
  }
};

const initializeForm = () => {
  if (!settings.value) return;

  const defaults = getDefaultCvSettings({
    settings: settings.value,
    experiences: experiences.value,
  });

  formState.value = {
    defaultTemplateId: defaults.defaultTemplateId,
    defaultEnabledSections: defaults.defaultEnabledSections,
    defaultIncludedExperienceIds: defaults.defaultIncludedExperienceIds,
    showProfilePhoto: defaults.showProfilePhoto,
  };
  initialized.value = true;
};

const handleSave = async () => {
  if (!settings.value || !formState.value) return;

  saving.value = true;
  try {
    await saveSettings({
      id: settings.value.id,
      defaultTemplateId: formState.value.defaultTemplateId,
      defaultEnabledSections: formState.value.defaultEnabledSections,
      defaultIncludedExperienceIds: formState.value.defaultIncludedExperienceIds,
      showProfilePhoto: formState.value.showProfilePhoto,
    });
    toast.add({
      title: t('cvSettings.toast.saved'),
      color: 'primary',
    });
  } catch {
    toast.add({
      title: t('cvSettings.toast.saveFailed'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

watch(
  userId,
  async (value) => {
    if (!value) {
      await loadUserId();
    }
    if (!userId.value) return;

    await Promise.all([load(), loadTemplates(), loadExperiences(userId.value)]);
    hasLoaded.value = true;
  },
  { immediate: true }
);

watch(
  [settings, experiences],
  () => {
    if (!initialized.value && settings.value) {
      initializeForm();
    }
  },
  { immediate: true }
);
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('cvSettings.title')"
        :description="t('cvSettings.subtitle')"
        :links="[
          {
            label: t('cvSettings.actions.templates'),
            icon: 'i-heroicons-arrow-top-right-on-square',
            to: '/templates/cv',
          },
        ]"
      />

      <UPageBody>
        <UAlert
          v-if="settingsError"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="settingsError"
          class="mb-6"
        />

        <ListSkeletonCards v-if="isLoading || !hasLoaded || !formState" />

        <CvSettingsForm
          v-else
          v-model="formState"
          :templates="templates"
          :experiences="experiences"
          :loading-experiences="loadingExperiences"
          :saving="saving"
          @save="handleSave"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
