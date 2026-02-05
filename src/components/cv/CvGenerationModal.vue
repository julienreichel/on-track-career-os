<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CvTemplateListItem } from '@/application/cvtemplate/useCvTemplates';
import type { Experience } from '@/domain/experience/Experience';
import type { CvSectionKey } from '@/domain/cvsettings/CvSectionKey';
import { CV_SECTION_KEYS } from '@/domain/cvsettings/CvSectionKey';
import CvExperienceMultiSelect from '@/components/cv/CvExperienceMultiSelect.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    templates: CvTemplateListItem[];
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
  { value: NO_TEMPLATE_VALUE, label: t('applications.cvs.settings.template.none') },
  ...props.templates.map((template) => ({
    value: template.id,
    label: template.name,
  })),
]);

const sectionOptions = computed(() =>
  CV_SECTION_KEYS.map((section) => ({
    value: section,
    label: t(`applications.cvs.settings.sectionLabels.${section}`),
  }))
);

const experienceSectionKeys = new Set(['experience', 'education', 'volunteer', 'projects']);

const sectionGroups = computed(() => {
  const experienceSections = sectionOptions.value.filter((section) =>
    experienceSectionKeys.has(section.value)
  );
  const otherSections = sectionOptions.value.filter(
    (section) => !experienceSectionKeys.has(section.value)
  );

  return [
    {
      key: 'experience',
      label: t('applications.cvs.settings.sections.sections.groupLabels.experience'),
      sections: experienceSections,
    },
    {
      key: 'profile',
      label: t('applications.cvs.settings.sections.sections.groupLabels.profile'),
      sections: otherSections,
    },
  ];
});

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
    :title="t('applications.cvs.generate.modal.title')"
    :description="t('applications.cvs.generate.modal.description')"
  >
    <template #body>
      <div class="space-y-6">
        <UFormField :label="t('applications.cvs.generate.modal.templateLabel')">
          <USelect v-model="selectedTemplate" :items="templateItems" class="w-full" />
        </UFormField>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-top-right-on-square"
          :label="t('applications.cvs.settings.template.manage')"
          to="/settings/cv"
          target="_blank"
          rel="noopener"
          class="w-fit"
        />

        <div class="space-y-3">
          <p class="text-sm font-medium text-default">
            {{ t('applications.cvs.generate.modal.sectionsLabel') }}
          </p>
          <div class="grid gap-6 sm:grid-cols-2">
            <div v-for="group in sectionGroups" :key="group.key" class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-dimmed">
                {{ group.label }}
              </p>
              <div class="grid gap-2">
                <UCheckbox
                  v-for="section in group.sections"
                  :key="section.value"
                  :model-value="enabledSections.includes(section.value)"
                  :label="section.label"
                  @update:model-value="toggleSection(section.value)"
                />
              </div>
            </div>
          </div>
        </div>

        <CvExperienceMultiSelect
          v-model="selectedExperienceIds"
          :experiences="props.experiences"
          :loading="props.loadingExperiences"
          :title="t('applications.cvs.generate.modal.experiencesTitle')"
          :empty-label="t('applications.cvs.generate.modal.experiencesEmpty')"
          :select-all-label="t('applications.cvs.generate.modal.selectAll')"
          :deselect-all-label="t('applications.cvs.generate.modal.deselectAll')"
          :selected-label="
            t('applications.cvs.generate.modal.selected', { count: selectedExperienceIds.length })
          "
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('common.actions.cancel')"
          @click="handleClose"
        />
        <UButton
          color="primary"
          :label="t('applications.cvs.generate.actions.generate')"
          :loading="props.generating"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
