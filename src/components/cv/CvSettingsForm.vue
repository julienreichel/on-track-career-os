<template>
  <div class="space-y-8">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-default">
            {{ t('cvSettings.sections.sections.title') }}
          </h2>
          <p class="text-sm text-dimmed">
            {{ t('cvSettings.sections.sections.description') }}
          </p>
        </div>
      </template>

      <div class="grid gap-2 sm:grid-cols-2">
        <UCheckbox
          v-for="section in sectionOptions"
          :key="section.value"
          :model-value="modelValue.defaultEnabledSections.includes(section.value)"
          :label="section.label"
          @update:model-value="toggleSection(section.value)"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-default">
            {{ t('cvSettings.sections.experiences.title') }}
          </h2>
          <p class="text-sm text-dimmed">
            {{ t('cvSettings.sections.experiences.description') }}
          </p>
        </div>
      </template>

      <CvExperienceMultiSelect
        v-model="experienceSelection"
        :experiences="experiences"
        :loading="loadingExperiences"
        :title="t('cvSettings.experiences.title')"
        :empty-label="t('cvSettings.experiences.empty')"
        :select-all-label="t('cvSettings.experiences.selectAll')"
        :deselect-all-label="t('cvSettings.experiences.deselectAll')"
        :selected-label="
          t('cvSettings.experiences.selected', { count: experienceSelection.length })
        "
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-default">
            {{ t('cvSettings.sections.other.title') }}
          </h2>
          <p class="text-sm text-dimmed">
            {{ t('cvSettings.sections.other.description') }}
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-default">
            {{ t('cvSettings.other.showProfilePhoto') }}
          </p>
          <USwitch v-model="showProfilePhoto" />
        </div>

        <UFormField :label="t('cvSettings.template.label')">
          <USelect v-model="selectedTemplate" :items="templateItems" class="w-full lg:w-1/2" />
        </UFormField>

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-top-right-on-square"
          :label="t('cvSettings.template.manage')"
          to="/templates/cv"
        />
      </div>
    </UCard>

    <div class="flex items-center justify-end">
      <UButton color="primary" :label="t('common.save')" :loading="saving" @click="$emit('save')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CV_SECTION_KEYS } from '@/domain/cvsettings/CvSectionKey';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { Experience } from '@/domain/experience/Experience';
import CvExperienceMultiSelect from '@/components/cv/CvExperienceMultiSelect.vue';

export type CvSettingsFormState = {
  defaultTemplateId: string | null;
  defaultEnabledSections: string[];
  defaultIncludedExperienceIds: string[];
  showProfilePhoto: boolean;
};

interface Props {
  modelValue: CvSettingsFormState;
  templates: CVTemplate[];
  experiences: Experience[];
  loadingExperiences?: boolean;
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loadingExperiences: false,
  saving: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: CvSettingsFormState];
  save: [];
}>();

const { t } = useI18n();

const updateValue = (patch: Partial<CvSettingsFormState>) => {
  emit('update:modelValue', { ...props.modelValue, ...patch });
};

const NO_TEMPLATE_VALUE = '__none__';

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

const selectedTemplate = computed({
  get: () => props.modelValue.defaultTemplateId ?? NO_TEMPLATE_VALUE,
  set: (value: string) =>
    updateValue({ defaultTemplateId: value === NO_TEMPLATE_VALUE ? null : value }),
});

const experienceSelection = computed({
  get: () => props.modelValue.defaultIncludedExperienceIds,
  set: (value: string[]) => updateValue({ defaultIncludedExperienceIds: value }),
});

const showProfilePhoto = computed({
  get: () => props.modelValue.showProfilePhoto,
  set: (value: boolean) => updateValue({ showProfilePhoto: value }),
});

const toggleSection = (key: string) => {
  const next = new Set(props.modelValue.defaultEnabledSections);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  updateValue({ defaultEnabledSections: Array.from(next) });
};
</script>
