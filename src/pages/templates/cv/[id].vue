<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="pageTitle"
        :description="t('cvTemplates.editor.subtitle')"
        :links="[
          {
            label: t('cvTemplates.editor.backToList'),
            icon: 'i-heroicons-arrow-left',
            to: { name: 'templates-cv' },
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

        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div class="flex items-center gap-2">
            <TemplateSourceBadge :source="template?.source" />
            <UBadge v-if="isDefault" color="primary" variant="soft">
              {{ t('cvTemplates.labels.default') }}
            </UBadge>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="template"
              size="sm"
              variant="ghost"
              :label="t('cvTemplates.editor.setDefault')"
              :disabled="isDefault || saving"
              @click="handleSetDefault"
            />
            <UButton
              size="sm"
              color="primary"
              :label="t('common.save')"
              :loading="saving"
              :disabled="!isDirty || saving || !template"
              @click="handleSave"
            />
            <UButton
              v-if="template"
              size="sm"
              color="error"
              variant="ghost"
              :label="t('common.delete')"
              :disabled="deleting"
              @click="deleteModalOpen = true"
            />
          </div>
        </div>

        <CvTemplateEditor
          v-if="template"
          v-model:name="name"
          v-model:content="content"
          :loading="loading || saving"
        />
        <UCard v-else-if="loading">
          <USkeleton class="h-6 w-40 mb-4" />
          <USkeleton class="h-10 w-full mb-4" />
          <USkeleton class="h-64 w-full" />
        </UCard>
      </UPageBody>

      <ConfirmModal
        v-model:open="deleteModalOpen"
        :title="t('cvTemplates.delete.title', { name: template?.name })"
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
import { useRoute, useRouter } from 'vue-router';
import { CVTemplateService } from '@/domain/cvtemplate/CVTemplateService';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import CvTemplateEditor from '@/components/cv/CvTemplateEditor.vue';
import TemplateSourceBadge from '@/components/cv/TemplateSourceBadge.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const service = new CVTemplateService();

const { settings, load: loadSettings, saveSettings } = useCvSettings();

const template = ref<CVTemplate | null>(null);
const name = ref('');
const content = ref('');
const originalName = ref('');
const originalContent = ref('');
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);
const deleteModalOpen = ref(false);

const pageTitle = computed(() => name.value || t('cvTemplates.editor.title'));
const isDirty = computed(
  () => name.value !== originalName.value || content.value !== originalContent.value
);
const isDefault = computed(
  () => template.value?.id && template.value.id === settings.value?.defaultTemplateId
);

const ensureSettings = async () => {
  if (!settings.value) {
    await loadSettings();
  }
  if (!settings.value) {
    throw new Error(t('cvTemplates.errors.settings'));
  }
  return settings.value;
};

const loadTemplate = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id as string;
    const loaded = await service.get(id);
    if (!loaded) {
      error.value = t('cvTemplates.errors.notFound');
      return;
    }
    template.value = loaded;
    name.value = loaded.name;
    content.value = loaded.content;
    originalName.value = loaded.name;
    originalContent.value = loaded.content;
  } catch (err) {
    error.value = t('cvTemplates.errors.loadFailed');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!template.value) return;
  saving.value = true;
  try {
    const updated = await service.update({
      id: template.value.id,
      name: name.value,
      content: content.value,
    });
    if (updated) {
      template.value = updated;
      originalName.value = updated.name;
      originalContent.value = updated.content;
      toast.add({
        title: t('cvTemplates.toast.saved'),
        color: 'primary',
      });
    }
  } catch (err) {
    toast.add({
      title: t('cvTemplates.toast.saveFailed'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const handleSetDefault = async () => {
  if (!template.value) return;
  try {
    const current = await ensureSettings();
    await saveSettings({
      id: current.id,
      defaultTemplateId: template.value.id,
    });
    toast.add({
      title: t('cvTemplates.toast.defaultSet'),
      color: 'primary',
    });
  } catch (err) {
    toast.add({
      title: t('cvTemplates.toast.defaultFailed'),
      color: 'error',
    });
  }
};

const handleDelete = async () => {
  if (!template.value) return;
  deleting.value = true;
  try {
    await service.delete(template.value.id);
    toast.add({
      title: t('cvTemplates.toast.deleted'),
      color: 'primary',
    });
    deleteModalOpen.value = false;
    await router.push({ name: 'templates-cv' });
  } catch (err) {
    toast.add({
      title: t('cvTemplates.toast.deleteFailed'),
      color: 'error',
    });
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadTemplate(), loadSettings()]);
});
</script>
