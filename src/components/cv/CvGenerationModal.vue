<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { Experience } from '@/domain/experience/Experience';
import type { CvSectionKey } from '@/domain/cvsettings/CvSectionKey';
import { CV_SECTION_KEYS } from '@/domain/cvsettings/CvSectionKey';
import CvExperienceMultiSelect from '@/components/cv/CvExperienceMultiSelect.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    templates: CVTemplate[];
    experiences: Experience[];
    loadingExperiences?: boolean;
    initialTemplateId: string | null;
    initialEnabledSections: CvSectionKey[];
    initialSelectedExperienceIds: string[];
    generating?: boolean;
  }>(),
  {
    loadingExperiences: false,
    generating: false,
  }
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [
    payload: {
      templateId: string | null;
      enabledSections: CvSectionKey[];
      selectedExperienceIds: string[];
    },
  ];
}>();

const { t } = useI18n();

const NO_TEMPLATE_VALUE = '__none__';

const selectedTemplate = ref<string>(NO_TEMPLATE_VALUE);
const enabledSections = ref<CvSectionKey[]>([]);
const selectedExperienceIds = ref<string[]>([]);

const modalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const templateItems = computed(() => [
  { value: NO_TEMPLATE_VALUE, label: t('cvSettings.template.none') },
  ...props.templates.map((template) => ({
    value: template.id,
    label: template.name,
  })),
]);

const sectionOptions = computed(() =>
  CV_SECTION_KEYS.map((section) => ({
    value: section,
    label: t(`cvSettings.sectionLabels.${section}`),
  }))
);

const syncStateFromProps = () => {
  selectedTemplate.value = props.initialTemplateId ?? NO_TEMPLATE_VALUE;
  enabledSections.value = [...props.initialEnabledSections];
  selectedExperienceIds.value = [...props.initialSelectedExperienceIds];
};

const handleClose = () => {
  emit('update:open', false);
};

const handleConfirm = () => {
  emit('confirm', {
    templateId: selectedTemplate.value === NO_TEMPLATE_VALUE ? null : selectedTemplate.value,
    enabledSections: enabledSections.value,
    selectedExperienceIds: selectedExperienceIds.value,
  });
};

const toggleSection = (section: CvSectionKey) => {
  const next = new Set(enabledSections.value);
  if (next.has(section)) {
    next.delete(section);
  } else {
    next.add(section);
  }
  enabledSections.value = Array.from(next);
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      syncStateFromProps();
    }
  },
  { immediate: true }
);

watch(
  () => [props.initialTemplateId, props.initialEnabledSections, props.initialSelectedExperienceIds],
  () => {
    if (props.open) {
      syncStateFromProps();
    }
  }
);
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    :title="t('cvGenerate.modal.title')"
    :description="t('cvGenerate.modal.description')"
  >
    <template #body>
      <div class="space-y-6">
        <UFormField :label="t('cvGenerate.modal.templateLabel')">
          <USelect v-model="selectedTemplate" :items="templateItems" class="w-full" />
        </UFormField>

        <div class="space-y-2">
          <p class="text-sm font-medium text-default">
            {{ t('cvGenerate.modal.sectionsLabel') }}
          </p>
          <div class="grid gap-2 sm:grid-cols-2">
            <UCheckbox
              v-for="section in sectionOptions"
              :key="section.value"
              :model-value="enabledSections.includes(section.value)"
              :label="section.label"
              @update:model-value="toggleSection(section.value)"
            />
          </div>
        </div>

        <CvExperienceMultiSelect
          v-model="selectedExperienceIds"
          :experiences="props.experiences"
          :loading="props.loadingExperiences"
          :title="t('cvGenerate.modal.experiencesTitle')"
          :empty-label="t('cvGenerate.modal.experiencesEmpty')"
          :select-all-label="t('cvGenerate.modal.selectAll')"
          :deselect-all-label="t('cvGenerate.modal.deselectAll')"
          :selected-label="t('cvGenerate.modal.selected', { count: selectedExperienceIds.length })"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('common.cancel')"
          @click="handleClose"
        />
        <UButton
          color="primary"
          :label="t('cvGenerate.actions.generate')"
          :loading="props.generating"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
