<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

const { t } = useI18n();

interface Props {
  profile: ParseCvTextOutput['profile'];
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
});

const emit = defineEmits<{
  updateField: [field: keyof ParseCvTextOutput['profile'], value: string | undefined];
  updateArrayField: [field: keyof ParseCvTextOutput['profile'], value: string[]];
}>();

function hasProfileData(profile: ParseCvTextOutput['profile']): boolean {
  return Boolean(
    profile.fullName ||
    profile.headline ||
    profile.location ||
    profile.seniorityLevel ||
    (profile.aspirations && profile.aspirations.length > 0) ||
    (profile.personalValues && profile.personalValues.length > 0) ||
    (profile.strengths && profile.strengths.length > 0) ||
    (profile.interests && profile.interests.length > 0) ||
    (profile.languages && profile.languages.length > 0)
  );
}

function asSingleValue(value?: string | null): string[] {
  return value ? [value] : [];
}

function handleSingleFieldUpdate(field: keyof ParseCvTextOutput['profile'], value: string[]): void {
  const nextValue = value[0]?.trim();
  emit('updateField', field, nextValue ? nextValue : undefined);
}

function handleArrayFieldUpdate(field: keyof ParseCvTextOutput['profile'], value: string[]): void {
  emit('updateArrayField', field, value);
}
</script>

<template>
  <UCard v-if="hasProfileData(profile)">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('cvUpload.sections.profile') }}
      </h3>
    </template>

    <div class="space-y-4">
      <!-- Single value fields -->
      <TagInput
        v-if="profile.fullName"
        :label="t('cvUpload.profile.fullName')"
        :placeholder="props.editable ? t('cvUpload.profile.fullName') : ''"
        :model-value="asSingleValue(profile.fullName)"
        :single="true"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleSingleFieldUpdate('fullName', value)"
      />

      <TagInput
        v-if="profile.headline"
        :label="t('cvUpload.profile.headline')"
        :placeholder="props.editable ? t('cvUpload.profile.headline') : ''"
        :model-value="asSingleValue(profile.headline)"
        :single="true"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleSingleFieldUpdate('headline', value)"
      />

      <TagInput
        v-if="profile.location"
        :label="t('cvUpload.profile.location')"
        :placeholder="props.editable ? t('cvUpload.profile.location') : ''"
        :model-value="asSingleValue(profile.location)"
        :single="true"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleSingleFieldUpdate('location', value)"
      />

      <TagInput
        v-if="profile.seniorityLevel"
        :label="t('cvUpload.profile.seniorityLevel')"
        :placeholder="props.editable ? t('cvUpload.profile.seniorityLevel') : ''"
        :model-value="asSingleValue(profile.seniorityLevel)"
        :single="true"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleSingleFieldUpdate('seniorityLevel', value)"
      />

      <!-- Array fields -->
      <TagInput
        v-if="profile.aspirations && profile.aspirations.length > 0"
        :label="t('cvUpload.profile.aspirations')"
        :model-value="profile.aspirations ?? []"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleArrayFieldUpdate('aspirations', value)"
      />

      <TagInput
        v-if="profile.personalValues && profile.personalValues.length > 0"
        :label="t('cvUpload.profile.personalValues')"
        :model-value="profile.personalValues ?? []"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleArrayFieldUpdate('personalValues', value)"
      />

      <TagInput
        v-if="profile.strengths && profile.strengths.length > 0"
        :label="t('cvUpload.profile.strengths')"
        :model-value="profile.strengths ?? []"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleArrayFieldUpdate('strengths', value)"
      />

      <TagInput
        v-if="profile.interests && profile.interests.length > 0"
        :label="t('cvUpload.profile.interests')"
        :model-value="profile.interests ?? []"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleArrayFieldUpdate('interests', value)"
      />

      <TagInput
        v-if="profile.languages && profile.languages.length > 0"
        :label="t('cvUpload.profile.languages')"
        :model-value="profile.languages ?? []"
        :editable="props.editable"
        color="neutral"
        @update:model-value="(value) => handleArrayFieldUpdate('languages', value)"
      />
    </div>
  </UCard>
</template>
