<template>
  <div class="space-y-8">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-default">
            {{ t('applications.cvs.settings.sections.sections.title') }}
          </h2>
          <p class="text-sm text-dimmed">
            {{ t('applications.cvs.settings.sections.sections.description') }}
          </p>
        </div>
      </template>

      <div class="grid gap-6 sm:grid-cols-2">
        <div v-for="group in sectionGroups" :key="group.key" class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-dimmed">
            {{ group.label }}
          </p>
          <div class="grid gap-2">
            <UCheckbox
              v-for="section in group.sections"
              :key="section.value"
              :model-value="!modelValue.defaultDisabledSections.includes(section.value)"
              :label="section.label"
              @update:model-value="toggleSection(section.value)"
            />
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-default">
            {{ t('applications.cvs.settings.sections.experiences.title') }}
          </h2>
          <p class="text-sm text-dimmed">
            {{ t('applications.cvs.settings.sections.experiences.description') }}
          </p>
        </div>
      </template>

      <CvExperienceMultiSelect
        v-model="experienceSelection"
        :experiences="experiences"
        :loading="loadingExperiences"
        :title="t('applications.cvs.settings.experiences.title')"
        :empty-label="t('applications.cvs.settings.experiences.empty')"
        :select-all-label="t('applications.cvs.settings.experiences.selectAll')"
        :deselect-all-label="t('applications.cvs.settings.experiences.deselectAll')"
        :selected-label="
          t('applications.cvs.settings.experiences.selected', { count: experienceSelection.length })
        "
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-default">
            {{ t('applications.cvs.settings.sections.other.title') }}
          </h2>
          <p class="text-sm text-dimmed">
            {{ t('applications.cvs.settings.sections.other.description') }}
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-default">
            {{ t('applications.cvs.settings.other.showProfilePhoto') }}
          </p>
          <USwitch v-model="showProfilePhoto" />
        </div>
      </div>
    </UCard>

    <div class="flex items-center justify-end">
      <UButton
        color="primary"
        type="button"
        :label="t('common.actions.save')"
        :loading="saving"
        @click="emit('save')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CV_SECTION_KEYS } from '@/domain/cvsettings/CvSectionKey';
import type { Experience } from '@/domain/experience/Experience';
import CvExperienceMultiSelect from '@/components/cv/CvExperienceMultiSelect.vue';

export type CvSettingsFormState = {
  defaultTemplateId: string | null;
  defaultDisabledSections: string[];
  defaultExcludedExperienceIds: string[];
  showProfilePhoto: boolean;
};

interface Props {
  modelValue: CvSettingsFormState;
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

const excludedExperienceIds = computed(() => new Set(props.modelValue.defaultExcludedExperienceIds));
const experienceIds = computed(() => props.experiences.map((experience) => experience.id));

const experienceSelection = computed({
  get: () => experienceIds.value.filter((id) => !excludedExperienceIds.value.has(id)),
  set: (value: string[]) => {
    const selected = new Set(value);
    const excluded = experienceIds.value.filter((id) => !selected.has(id));
    updateValue({ defaultExcludedExperienceIds: excluded });
  },
});

const showProfilePhoto = computed({
  get: () => props.modelValue.showProfilePhoto,
  set: (value: boolean) => updateValue({ showProfilePhoto: value }),
});

const toggleSection = (key: string) => {
  const next = new Set(props.modelValue.defaultDisabledSections);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  updateValue({ defaultDisabledSections: Array.from(next) });
};
</script>
