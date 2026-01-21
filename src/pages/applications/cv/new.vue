<template>
  <UPage>
    <UPageHeader :title="t('cvGenerate.title')" :description="t('cvGenerate.subtitle')" />

    <UPageBody>
      <CvGenerateEntryCard
        :template-name="templateLabel"
        :section-count="selectedSections.length"
        :experience-count="selectedExperienceIds.length"
        :show-profile-photo="defaults.showProfilePhoto"
        :generating="isGenerating"
        @generate="handleGenerateClick"
        @edit-settings="modalOpen = true"
      />

      <CvGenerationModal
        v-model:open="modalOpen"
        :templates="templates"
        :experiences="experiences"
        :loading-experiences="loadingExperiences"
        :initial-template-id="selectedTemplateId"
        :initial-enabled-sections="selectedSections"
        :initial-selected-experience-ids="selectedExperienceIds"
        :generating="isGenerating"
        @confirm="handleModalConfirm"
      />
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthUser } from '@/composables/useAuthUser';
import { useCvDocuments } from '@/composables/useCvDocuments';
import { useCvGenerator } from '@/composables/useCvGenerator';
import { useTailoredMaterials } from '@/application/tailoring/useTailoredMaterials';
import { useCvSettings } from '@/application/cvsettings/useCvSettings';
import { useCvTemplates } from '@/application/cvtemplate/useCvTemplates';
import { getDefaultCvSettings } from '@/domain/cvsettings/getDefaultCvSettings';
import { ExperienceRepository } from '@/domain/experience/ExperienceRepository';
import type { Experience } from '@/domain/experience/Experience';
import type { CvSectionKey } from '@/domain/cvsettings/CvSectionKey';
import { resolveSystemCvTemplates } from '@/domain/cvtemplate/systemTemplates';
import CvGenerateEntryCard from '@/components/cv/CvGenerateEntryCard.vue';
import CvGenerationModal from '@/components/cv/CvGenerationModal.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { userId, loadUserId } = useAuthUser();
const { createDocument } = useCvDocuments();
const { generateCv, generating, error: generationError } = useCvGenerator();
const tailoredMaterials = useTailoredMaterials();
const { settings, load: loadSettings } = useCvSettings();
const { templates, load: loadTemplates } = useCvTemplates();
const experienceRepo = new ExperienceRepository();

const experiences = ref<Experience[]>([]);
const loadingExperiences = ref(false);
const modalOpen = ref(false);
const initialized = ref(false);
const preparing = ref(false);

const selectedTemplateId = ref<string | null>(null);
const selectedSections = ref<CvSectionKey[]>([]);
const selectedExperienceIds = ref<string[]>([]);

const jobId = computed(() => {
  const value = route.query.jobId;
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return null;
});

const defaults = computed(() =>
  getDefaultCvSettings({
    settings: settings.value,
    experiences: experiences.value,
  })
);

const systemTemplates = computed(() => resolveSystemCvTemplates(locale.value, t));
const fallbackTemplate = computed(() => systemTemplates.value[0] ?? null);
const templateLabel = computed(() => {
  const template = templates.value.find((item) => item.id === selectedTemplateId.value);
  if (template?.name) {
    return template.name;
  }
  return fallbackTemplate.value?.name ?? t('cvGenerate.entry.templateFallback');
});

const isGenerating = computed(
  () => preparing.value || generating.value || tailoredMaterials.isGenerating.value
);

const setDefaults = () => {
  selectedTemplateId.value = defaults.value.defaultTemplateId;
  selectedSections.value = [...defaults.value.defaultEnabledSections] as CvSectionKey[];
  selectedExperienceIds.value = [...defaults.value.defaultIncludedExperienceIds];
};

const resolveTemplateMarkdown = (templateId: string | null) => {
  const template = templates.value.find((item) => item.id === templateId);
  if (template?.content?.trim()) {
    return template.content.trim();
  }
  return fallbackTemplate.value?.content?.trim() ?? '';
};

const resolveGenerationContext = (override?: {
  templateId?: string | null;
  enabledSections?: CvSectionKey[];
  selectedExperienceIds?: string[];
}) => {
  const templateId = override?.templateId ?? selectedTemplateId.value;
  const enabledSections = override?.enabledSections ?? selectedSections.value;
  const experienceIds = override?.selectedExperienceIds ?? selectedExperienceIds.value;

  return {
    templateId: templateId ?? null,
    templateMarkdown: resolveTemplateMarkdown(templateId ?? null),
    enabledSections,
    selectedExperienceIds: experienceIds,
    showProfilePhoto: defaults.value.showProfilePhoto,
  };
};

const generateGenericCv = async (context: ReturnType<typeof resolveGenerationContext>) => {
  if (!userId.value) {
    return;
  }

  const cvMarkdown = await generateCv(userId.value, context.selectedExperienceIds, {
    enabledSections: context.enabledSections,
    templateMarkdown: context.templateMarkdown,
  });

  if (!cvMarkdown) {
    toast.add({
      title: t('cvGenerate.toast.generationFailed'),
      description: generationError.value || undefined,
      color: 'error',
    });
    return;
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date());
  const cvDocument = await createDocument({
    name: t('cvGenerate.defaultName', { date: dateLabel }),
    userId: userId.value,
    isTailored: false,
    content: cvMarkdown,
    showProfilePhoto: context.showProfilePhoto,
    templateId: context.templateId ?? undefined,
  });

  if (!cvDocument) {
    toast.add({
      title: t('cvGenerate.toast.createFailed'),
      color: 'error',
    });
    return;
  }

  toast.add({
    title: t('cvGenerate.toast.created'),
    color: 'primary',
  });

  await router.push({
    name: 'applications-cv-id',
    params: { id: cvDocument.id },
  });
};

const generateTailoredCv = async (
  context: ReturnType<typeof resolveGenerationContext>,
  targetJobId: string
) => {
  const tailoringContext = await tailoredMaterials.loadTailoringContext(targetJobId);
  if (!tailoringContext.ok) {
    toast.add({
      title: t('cvGenerate.toast.error'),
      color: 'error',
    });
    await router.push('/jobs');
    return;
  }

  if (!tailoringContext.matchingSummary) {
    toast.add({
      title: t('cvGenerate.toast.generationFailed'),
      color: 'error',
    });
    await router.push(`/jobs/${targetJobId}/match`);
    return;
  }

  const created = await tailoredMaterials.generateTailoredCvForJob({
    job: tailoringContext.job,
    matchingSummary: tailoringContext.matchingSummary,
    options: {
      name: `Tailored CV — ${tailoringContext.job.title}`,
      templateId: context.templateId ?? undefined,
      templateMarkdown: context.templateMarkdown,
      enabledSections: context.enabledSections,
      selectedExperienceIds: context.selectedExperienceIds,
      showProfilePhoto: context.showProfilePhoto,
    },
  });

  if (!created?.id) {
    toast.add({
      title: t('cvGenerate.toast.createFailed'),
      color: 'error',
    });
    return;
  }

  await router.push({
    name: 'applications-cv-id',
    params: { id: created.id },
  });
};

const startGeneration = async (override?: {
  templateId?: string | null;
  enabledSections?: CvSectionKey[];
  selectedExperienceIds?: string[];
}) => {
  if (!userId.value) {
    return;
  }

  const context = resolveGenerationContext(override);
  if (jobId.value) {
    await generateTailoredCv(context, jobId.value);
    return;
  }

  await generateGenericCv(context);
};

const handleGenerateClick = async () => {
  await prepareDefaults();
  if (!userId.value) {
    toast.add({ title: t('cvGenerate.toast.error'), color: 'error' });
    return;
  }
  void startGeneration();
};

const handleModalConfirm = async (payload: {
  templateId: string | null;
  enabledSections: CvSectionKey[];
  selectedExperienceIds: string[];
}) => {
  modalOpen.value = false;
  await prepareDefaults();
  void startGeneration(payload);
};

const loadExperiences = async () => {
  if (!userId.value) {
    return;
  }

  loadingExperiences.value = true;
  try {
    experiences.value = await experienceRepo.list(userId.value);
  } finally {
    loadingExperiences.value = false;
  }
};

const ensureLoaded = async () => {
  if (!userId.value) {
    await loadUserId();
  }
  if (!userId.value) {
    return;
  }

  await Promise.all([loadSettings(), loadTemplates(), loadExperiences()]);
  initialized.value = true;
};

const prepareDefaults = async () => {
  if (initialized.value || preparing.value) {
    return;
  }
  preparing.value = true;
  try {
    await ensureLoaded();
    setDefaults();
  } finally {
    preparing.value = false;
  }
};

watch(
  () => defaults.value,
  () => {
    if (!initialized.value) {
      return;
    }
    setDefaults();
  },
  { immediate: true }
);

onMounted(async () => {
  await ensureLoaded();
  setDefaults();
});
</script>
