<script setup lang="ts">
import { logError } from '@/utils/logError';
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthUser } from '@/composables/useAuthUser';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import { getDefaultCvSettings } from '@/domain/cvsettings/getDefaultCvSettings';
import type { CvTemplateListItem } from '@/application/cvtemplate/useCvTemplates';
import CvSettingsForm, { type CvSettingsFormState } from '@/components/cv/CvSettingsForm.vue';
import CvTemplateCard from '@/components/cv/CvTemplateCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import { formatListDate } from '@/utils/formatListDate';
defineOptions({ name: 'CvSettingsPage' });

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const auth = useAuthUser();
const { userId } = auth;
const experienceRepo = new ExperienceRepository();
const {
  settings,
  loading: settingsLoading,
  error: settingsError,
  load,
  saveSettings,
} = useCvSettings({ auth });
const {
  templates,
  loading: templatesLoading,
  error: templatesError,
  load: loadTemplates,
  createTemplate,
  deleteTemplate,
} = useCvTemplates({ auth });

const experiences = ref<Experience[]>([]);
const loadingExperiences = ref(false);
const saving = ref(false);
const deletingTemplate = ref(false);
const hasLoaded = ref(false);
const formState = ref<CvSettingsFormState | null>(null);
const initialized = ref(false);
const deleteModalOpen = ref(false);
const templateToDelete = ref<CvTemplateListItem | null>(null);

const isLoading = computed(
  () => settingsLoading.value || templatesLoading.value || loadingExperiences.value
);
const isReady = computed(() =>
  Boolean(settings.value && formState.value && hasLoaded.value && !isLoading.value)
);
const defaultTemplateId = computed(
  () => formState.value?.defaultTemplateId ?? settings.value?.defaultTemplateId ?? null
);

const loadExperiences = async (ownerId: string) => {
  loadingExperiences.value = true;
  try {
    experiences.value = await experienceRepo.list(ownerId);
  } catch (error) {
    logError('[cvSettings] Failed to load experiences:', error);
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
    defaultDisabledSections: defaults.defaultDisabledSections,
    defaultExcludedExperienceIds: defaults.defaultExcludedExperienceIds,
    showProfilePhoto: defaults.showProfilePhoto,
  };
  initialized.value = true;
};

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortedTemplates = computed<CvTemplateListItem[]>(() =>
  [...templates.value].sort((a, b) => {
    const aTime = toTimestamp(a.updatedAt ?? a.createdAt);
    const bTime = toTimestamp(b.updatedAt ?? b.createdAt);
    return bTime - aTime;
  })
);

const formatTemplateDate = (template: CvTemplateListItem) =>
  formatListDate(template.updatedAt ?? template.createdAt);

const handleSave = async () => {
  if (!settings.value || !formState.value) return;

  saving.value = true;
  try {
    await saveSettings({
      id: settings.value.id,
      defaultTemplateId: formState.value.defaultTemplateId,
      defaultDisabledSections: formState.value.defaultDisabledSections,
      defaultExcludedExperienceIds: formState.value.defaultExcludedExperienceIds,
      showProfilePhoto: formState.value.showProfilePhoto,
    });
    toast.add({
      title: t('applications.cvs.settings.toast.saved'),
      color: 'primary',
    });
  } catch {
    toast.add({
      title: t('applications.cvs.settings.toast.saveFailed'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const handleEdit = (template: CvTemplateListItem) => {
  void router.push({ name: 'settings-cv-id', params: { id: template.id } });
};

const handleDuplicate = async (template: CvTemplateListItem) => {
  try {
    const created = await createTemplate({
      name: t('applications.cvs.templates.list.duplicateName', { name: template.name }),
      content: template.content,
      source: template.source ?? undefined,
    });
    if (created) {
      toast.add({
        title: t('applications.cvs.templates.toast.created'),
        color: 'primary',
      });
      await router.push({ name: 'settings-cv-id', params: { id: created.id } });
    }
  } catch {
    toast.add({
      title: t('applications.cvs.templates.toast.createFailed'),
      color: 'error',
    });
  }
};

const confirmDelete = (template: CvTemplateListItem) => {
  templateToDelete.value = template;
  deleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!templateToDelete.value) return;
  deletingTemplate.value = true;
  try {
    const deletedId = templateToDelete.value.id;
    await deleteTemplate(deletedId);
    if (defaultTemplateId.value === deletedId && settings.value) {
      const nextDefault =
        sortedTemplates.value.find((template) => template.id !== deletedId)?.id ?? null;
      try {
        await saveSettings({
          id: settings.value.id,
          defaultTemplateId: nextDefault,
          defaultDisabledSections: formState.value?.defaultDisabledSections ?? [],
          defaultExcludedExperienceIds: formState.value?.defaultExcludedExperienceIds ?? [],
          showProfilePhoto: formState.value?.showProfilePhoto ?? true,
        });
        if (formState.value) {
          formState.value = {
            ...formState.value,
            defaultTemplateId: nextDefault,
          };
        }
      } catch {
        toast.add({
          title: t('applications.cvs.settings.toast.saveFailed'),
          color: 'error',
        });
      }
    }
    toast.add({
      title: t('applications.cvs.templates.toast.deleted'),
      color: 'primary',
    });
    deleteModalOpen.value = false;
  } catch {
    toast.add({
      title: t('applications.cvs.templates.toast.deleteFailed'),
      color: 'error',
    });
  } finally {
    deletingTemplate.value = false;
  }
};

const initializePage = async () => {
  await auth.loadUserId();
  if (!userId.value) {
    hasLoaded.value = true;
    return;
  }

  await Promise.allSettled([load(), loadTemplates(), loadExperiences(userId.value)]);
  hasLoaded.value = true;
};

onMounted(() => {
  void initializePage();
});

watch(
  [settings, experiences, loadingExperiences],
  () => {
    if (!initialized.value && settings.value && !loadingExperiences.value) {
      initializeForm();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <UPage>
      <UPageHeader
        :title="t('applications.cvs.settings.title')"
        :description="t('applications.cvs.settings.subtitle')"
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
        <UAlert
          v-else-if="templatesError"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="templatesError"
          class="mb-6"
        />

        <ListSkeletonCards v-if="!isReady" />

        <div v-else class="space-y-10">
          <section id="cv-templates">
            <UCard>
              <template #header>
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold text-default">
                    {{ t('applications.cvs.templates.list.title') }}
                  </h2>
                  <p class="text-sm text-dimmed">
                    {{ t('applications.cvs.templates.list.subtitle') }}
                  </p>
                </div>
              </template>

              <UEmpty
                v-if="sortedTemplates.length === 0"
                :title="t('applications.cvs.templates.list.empty.title')"
                icon="i-heroicons-document-text"
              >
                <p class="text-sm text-gray-500">
                  {{ t('applications.cvs.templates.list.empty.description') }}
                </p>
              </UEmpty>

              <UPageGrid v-else>
                <CvTemplateCard
                  v-for="template in sortedTemplates"
                  :key="template.id"
                  :name="template.name"
                  :description="template.description"
                  :is-default="template.id === defaultTemplateId"
                  :is-system-template="template.isSystemTemplate"
                  :updated-at="formatTemplateDate(template)"
                  :primary-action-label="t('common.actions.edit')"
                  primary-action-icon="i-heroicons-pencil"
                  :secondary-action-label="t('applications.cvs.templates.list.actions.duplicate')"
                  secondary-action-icon="i-heroicons-document-duplicate"
                  :show-delete="!template.isSystemTemplate"
                  :delete-label="t('common.actions.delete')"
                  delete-icon="i-heroicons-trash"
                  :data-testid="`cv-template-${template.id}`"
                  @primary="handleEdit(template)"
                  @secondary="handleDuplicate(template)"
                  @delete="confirmDelete(template)"
                />
              </UPageGrid>
            </UCard>
          </section>

          <CvSettingsForm
            v-model="formState!"
            :experiences="experiences"
            :loading-experiences="loadingExperiences"
            :saving="saving"
            @save="handleSave"
          />
        </div>
      </UPageBody>
    </UPage>

    <ConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('applications.cvs.templates.delete.title', { name: templateToDelete?.name })"
      :description="t('applications.cvs.templates.delete.description')"
      :confirm-label="t('common.actions.delete')"
      :cancel-label="t('common.actions.cancel')"
      confirm-color="error"
      :loading="deletingTemplate"
      @confirm="handleDelete"
    />

  </div>
</template>
