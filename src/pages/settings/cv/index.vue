<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthUser } from '@/composables/useAuthUser';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import { getDefaultCvSettings } from '@/domain/cvsettings/getDefaultCvSettings';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { SystemCvTemplate } from '@/domain/cvtemplate/systemTemplates';
import CvSettingsForm, { type CvSettingsFormState } from '@/components/cv/CvSettingsForm.vue';
import CvTemplateCard from '@/components/cv/CvTemplateCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import { formatListDate } from '@/utils/formatListDate';
defineOptions({ name: 'CvSettingsPage' });

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const { userId, loadUserId } = useAuthUser();
const experienceRepo = new ExperienceRepository();

const {
  settings,
  loading: settingsLoading,
  error: settingsError,
  load,
  saveSettings,
} = useCvSettings();
const {
  templates,
  systemTemplates,
  loading: templatesLoading,
  error: templatesError,
  load: loadTemplates,
  createFromExemplar,
  createTemplate,
  deleteTemplate,
} = useCvTemplates();

const experiences = ref<Experience[]>([]);
const loadingExperiences = ref(false);
const saving = ref(false);
const deletingTemplate = ref(false);
const hasLoaded = ref(false);
const formState = ref<CvSettingsFormState | null>(null);
const initialized = ref(false);
const deleteModalOpen = ref(false);
const templateToDelete = ref<CVTemplate | null>(null);
const createModalOpen = ref(false);
const creatingTemplate = ref(false);

const isLoading = computed(
  () => settingsLoading.value || templatesLoading.value || loadingExperiences.value
);
const defaultTemplateId = computed(
  () => formState.value?.defaultTemplateId ?? settings.value?.defaultTemplateId ?? null
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

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortedTemplates = computed(() =>
  [...templates.value].sort((a, b) => {
    const aTime = toTimestamp(a.updatedAt ?? a.createdAt);
    const bTime = toTimestamp(b.updatedAt ?? b.createdAt);
    return bTime - aTime;
  })
);

const formatTemplateDate = (template: CVTemplate) =>
  formatListDate(template.updatedAt ?? template.createdAt);

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

const handleCreateFromBase = async (template: SystemCvTemplate) => {
  if (creatingTemplate.value) return;
  creatingTemplate.value = true;
  try {
    const created = await createFromExemplar(template);
    if (created) {
      toast.add({
        title: t('cvTemplates.toast.created'),
        color: 'primary',
      });
      createModalOpen.value = false;
      await router.push({ name: 'settings-cv-id', params: { id: created.id } });
    }
  } catch {
    toast.add({
      title: t('cvTemplates.toast.createFailed'),
      color: 'error',
    });
  } finally {
    creatingTemplate.value = false;
  }
};

const handleEdit = (template: CVTemplate) => {
  void router.push({ name: 'settings-cv-id', params: { id: template.id } });
};

const handleDuplicate = async (template: CVTemplate) => {
  try {
    const created = await createTemplate({
      name: t('cvTemplates.list.duplicateName', { name: template.name }),
      content: template.content,
      source: 'user',
    });
    if (created) {
      toast.add({
        title: t('cvTemplates.toast.created'),
        color: 'primary',
      });
      await router.push({ name: 'settings-cv-id', params: { id: created.id } });
    }
  } catch {
    toast.add({
      title: t('cvTemplates.toast.createFailed'),
      color: 'error',
    });
  }
};

const confirmDelete = (template: CVTemplate) => {
  templateToDelete.value = template;
  deleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!templateToDelete.value) return;
  deletingTemplate.value = true;
  try {
    await deleteTemplate(templateToDelete.value.id);
    toast.add({
      title: t('cvTemplates.toast.deleted'),
      color: 'primary',
    });
    deleteModalOpen.value = false;
  } catch {
    toast.add({
      title: t('cvTemplates.toast.deleteFailed'),
      color: 'error',
    });
  } finally {
    deletingTemplate.value = false;
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
  <div>
    <UContainer>
      <UPage>
        <UPageHeader
          :title="t('cvSettings.title')"
          :description="t('cvSettings.subtitle')"
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

          <ListSkeletonCards v-if="isLoading || !hasLoaded || !formState" />

          <div v-else class="space-y-10">
            <section id="cv-templates">
              <UCard>
                <template #header>
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="space-y-1">
                      <h2 class="text-lg font-semibold text-default">
                        {{ t('cvTemplates.list.title') }}
                      </h2>
                      <p class="text-sm text-dimmed">
                        {{ t('cvTemplates.list.subtitle') }}
                      </p>
                    </div>
                    <UButton
                      color="primary"
                      variant="soft"
                      :label="t('cvTemplates.list.actions.create')"
                      icon="i-heroicons-plus"
                      @click="createModalOpen = true"
                    />
                  </div>
                </template>

                <UEmpty
                  v-if="sortedTemplates.length === 0"
                  :title="t('cvTemplates.list.empty.title')"
                  icon="i-heroicons-document-text"
                >
                  <p class="text-sm text-gray-500">
                    {{ t('cvTemplates.list.empty.description') }}
                  </p>
                  <template #actions>
                    <UButton
                      color="primary"
                      :label="t('cvTemplates.list.actions.create')"
                      icon="i-heroicons-plus"
                      @click="createModalOpen = true"
                    />
                  </template>
                </UEmpty>

                <UPageGrid v-else>
                  <CvTemplateCard
                    v-for="template in sortedTemplates"
                    :key="template.id"
                    :name="template.name"
                    :is-default="template.id === defaultTemplateId"
                    :updated-at="formatTemplateDate(template)"
                    :primary-action-label="t('common.edit')"
                    primary-action-icon="i-heroicons-pencil"
                    :secondary-action-label="t('cvTemplates.list.actions.duplicate')"
                    secondary-action-icon="i-heroicons-document-duplicate"
                    :show-delete="true"
                    :delete-label="t('common.delete')"
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
              v-model="formState"
              :experiences="experiences"
              :loading-experiences="loadingExperiences"
              :saving="saving"
              @save="handleSave"
            />
          </div>
        </UPageBody>
      </UPage>
    </UContainer>

    <ConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('cvTemplates.delete.title', { name: templateToDelete?.name })"
      :description="t('cvTemplates.delete.description')"
      :confirm-label="t('common.delete')"
      :cancel-label="t('common.cancel')"
      confirm-color="error"
      :loading="deletingTemplate"
      @confirm="handleDelete"
    />

    <UModal
      v-model:open="createModalOpen"
      :title="t('cvTemplates.list.system.title')"
      :description="t('cvTemplates.list.system.description')"
    >
      <template #body>
        <div class="flex flex-col gap-3">
          <UButton
            v-for="template in systemTemplates"
            :key="template.id"
            color="neutral"
            variant="soft"
            class="w-full justify-between"
            :label="template.name"
            :loading="creatingTemplate"
            @click="handleCreateFromBase(template)"
          />
        </div>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('common.cancel')"
          @click="createModalOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>
