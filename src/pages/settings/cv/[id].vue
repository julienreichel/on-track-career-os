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
          :preview-content="previewContent ?? ''"
          :preview-loading="previewLoading"
          :preview-error="previewError"
          @preview="handlePreview"
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
import { useCvGenerator } from '@/composables/useCvGenerator';
import { useAuthUser } from '@/composables/useAuthUser';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import type { CvSectionKey } from '@/domain/cvsettings/CvSectionKey';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const service = new CVTemplateService();
const experienceRepo = new ExperienceRepository();
const { generateCv } = useCvGenerator();
const { userId, loadUserId } = useAuthUser();

const { settings, load: loadSettings, saveSettings } = useCvSettings();

const template = ref<CVTemplate | null>(null);
const name = ref('');
const content = ref('');
const originalName = ref('');
const originalContent = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const previewContent = ref<string | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);

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

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const previewExperiencesPerType = 2;

const selectPreviewExperienceIds = (items: Experience[]): string[] => {
  const byType = new Map<string, Experience[]>();
  items.forEach((exp) => {
    const type = exp.experienceType ?? 'work';
    const list = byType.get(type) ?? [];
    list.push(exp);
    byType.set(type, list);
  });

  const selected: string[] = [];
  byType.forEach((list) => {
    list
      .sort((a, b) => toTimestamp(b.updatedAt ?? b.createdAt) - toTimestamp(a.updatedAt ?? a.createdAt))
      .slice(0, previewExperiencesPerType)
      .forEach((exp) => selected.push(exp.id));
  });
  return selected;
};

const resolvePreviewExperienceIds = async (): Promise<string[]> => {
  if (!userId.value) {
    await loadUserId();
  }
  if (!userId.value) {
    return [];
  }
  const all = await experienceRepo.list(userId.value);
  return selectPreviewExperienceIds(all);
};

const handlePreview = async () => {
  previewError.value = null;
  previewLoading.value = true;

  try {
    const previewExperienceIds = await resolvePreviewExperienceIds();
    if (!userId.value) {
      previewError.value = t('common.error');
      return;
    }

    const enabledSections =
      settings.value?.defaultEnabledSections && settings.value.defaultEnabledSections.length > 0
        ? settings.value.defaultEnabledSections.filter(
            (section): section is CvSectionKey => typeof section === 'string'
          )
        : undefined;

    const result = await generateCv(userId.value, previewExperienceIds, {
      templateMarkdown: content.value,
      enabledSections,
      includeLinks: true,
      includeSkills: true,
      includeLanguages: true,
      includeCertifications: true,
      includeInterests: true,
    });

    previewContent.value = result ?? '';
    if (!result) {
      previewError.value = t('cvTemplates.editor.previewFailed');
    }
  } catch {
    previewError.value = t('cvTemplates.editor.previewFailed');
  } finally {
    previewLoading.value = false;
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
