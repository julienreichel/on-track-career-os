<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('cvTemplates.list.title')"
        :description="t('cvTemplates.list.subtitle')"
        :links="[
          {
            label: t('cvTemplates.list.actions.create'),
            icon: 'i-heroicons-plus',
            onClick: handleCreateBlank,
          },
        ]"
      />

      <UPageBody>
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          :title="t('common.error')"
          :description="error"
          class="mb-6"
        />

        <ListSkeletonCards v-if="loading || !hasLoaded" />

      <div v-else class="space-y-8">
        <UCard>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-lg font-semibold text-default">
                  {{ t('cvTemplates.list.system.title') }}
                </h2>
                <p class="text-sm text-dimmed">
                  {{ t('cvTemplates.list.system.description') }}
                </p>
              </div>
            </template>

            <UPageGrid>
              <CvTemplateCard
                v-for="template in systemTemplates"
                :key="template.id"
                :name="template.name"
                :description="template.description"
                :source="template.source"
                :primary-action-label="t('cvTemplates.list.actions.useTemplate')"
                primary-action-icon="i-heroicons-arrow-right"
                :data-testid="systemTemplateTestId(template.id)"
                @primary="handleUseTemplate(template)"
              />
            </UPageGrid>
          </UCard>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <h2 class="text-lg font-semibold text-default">
                  {{ t('cvTemplates.list.user.title') }}
                </h2>
                <p class="text-sm text-dimmed">
                  {{ t('cvTemplates.list.user.description') }}
                </p>
              </div>
            </div>

            <UCard v-if="sortedTemplates.length === 0">
              <UEmpty :title="t('cvTemplates.list.empty.title')" icon="i-heroicons-document-text">
                <p class="text-sm text-gray-500">
                  {{ t('cvTemplates.list.empty.description') }}
                </p>
                <template #actions>
                  <UButton
                    color="primary"
                    :label="t('cvTemplates.list.actions.create')"
                    icon="i-heroicons-plus"
                    @click="handleCreateBlank"
                  />
                </template>
              </UEmpty>
            </UCard>

            <UPageGrid v-else>
              <CvTemplateCard
                v-for="template in sortedTemplates"
                :key="template.id"
                :name="template.name"
                :source="template.source"
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
                @primary="handleEdit(template.id)"
                @secondary="handleDuplicate(template)"
                @delete="confirmDelete(template)"
              />
            </UPageGrid>
          </div>
        </div>
      </UPageBody>

      <ConfirmModal
        v-model:open="deleteModalOpen"
        :title="t('cvTemplates.delete.title', { name: templateToDelete?.name })"
        :description="t('cvTemplates.delete.description')"
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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { SystemCvTemplate } from '@/domain/cvtemplate/systemTemplates';
import CvTemplateCard from '@/components/cv/CvTemplateCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ListSkeletonCards from '@/components/common/ListSkeletonCards.vue';
import { formatListDate } from '@/utils/formatListDate';

const { t } = useI18n();
const toast = useToast();
const router = useRouter();

const {
  templates,
  systemTemplates,
  loading,
  error,
  load,
  createFromExemplar,
  createTemplate,
  deleteTemplate,
} = useCvTemplates();

const { settings, load: loadSettings } = useCvSettings();

const hasLoaded = ref(false);
const deleteModalOpen = ref(false);
const templateToDelete = ref<CVTemplate | null>(null);
const deleting = ref(false);

const defaultTemplateId = computed(() => settings.value?.defaultTemplateId ?? null);

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

const systemTemplateTestId = (id: string) => `cv-template-system-${id.replace(/[:]/g, '-')}`;

const handleCreateBlank = async () => {
  try {
    const created = await createTemplate({
      name: t('cvTemplates.list.newTemplateName'),
      content: '',
      source: 'user',
    });
    if (created) {
      toast.add({
        title: t('cvTemplates.toast.created'),
        color: 'primary',
      });
      await router.push({ name: 'templates-cv-id', params: { id: created.id } });
    }
  } catch {
    toast.add({
      title: t('cvTemplates.toast.createFailed'),
      color: 'error',
    });
  }
};

const handleUseTemplate = async (template: SystemCvTemplate) => {
  try {
    const created = await createFromExemplar(template);
    if (created) {
      toast.add({
        title: t('cvTemplates.toast.created'),
        color: 'primary',
      });
      await router.push({ name: 'templates-cv-id', params: { id: created.id } });
    }
  } catch {
    toast.add({
      title: t('cvTemplates.toast.createFailed'),
      color: 'error',
    });
  }
};

const handleEdit = (id: string) => {
  void router.push({ name: 'templates-cv-id', params: { id } });
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
      await router.push({ name: 'templates-cv-id', params: { id: created.id } });
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

  deleting.value = true;
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
    deleting.value = false;
  }
};

onMounted(() => {
  hasLoaded.value = false;
  void Promise.all([load(), loadSettings()]).finally(() => {
    hasLoaded.value = true;
  });
});
</script>
