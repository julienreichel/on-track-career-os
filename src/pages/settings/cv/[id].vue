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
            to: { name: 'settings-cv' },
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

        <div class="flex items-center gap-2 mb-6">
          <UBadge v-if="isDefault" color="primary" variant="soft">
            {{ t('cvTemplates.labels.default') }}
          </UBadge>
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

        <div class="flex flex-wrap justify-end gap-2 pt-6">
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
            :disabled="saving || !template"
            @click="handleSave"
          />
        </div>
      </UPageBody>
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
const error = ref<string | null>(null);

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
  } catch {
    error.value = t('cvTemplates.errors.loadFailed');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!template.value) return;
  if (isDirty.value) {
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
    } catch {
      toast.add({
        title: t('cvTemplates.toast.saveFailed'),
        color: 'error',
      });
    } finally {
      saving.value = false;
    }
  }
  await router.push({ name: 'settings-cv' });
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
  } catch {
    toast.add({
      title: t('cvTemplates.toast.defaultFailed'),
      color: 'error',
    });
  }
};

onMounted(async () => {
  await Promise.all([loadTemplate(), loadSettings()]);
  if (template.value && settings.value && !settings.value.defaultTemplateId) {
    try {
      await saveSettings({
        id: settings.value.id,
        defaultTemplateId: template.value.id,
      });
    } catch {
      toast.add({
        title: t('cvTemplates.toast.defaultFailed'),
        color: 'error',
      });
    }
  }
});
</script>
