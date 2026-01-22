<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

const { t } = useI18n();

interface Props {
  profile: ParseCvTextOutput['profile'];
}

defineProps<Props>();

const emit = defineEmits<{
  removeField: [field: keyof ParseCvTextOutput['profile']];
  removeArrayItem: [field: keyof ParseCvTextOutput['profile'], index: number];
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
      <CvSingleBadge
        v-if="profile.fullName"
        :label="t('cvUpload.profile.fullName')"
        :value="profile.fullName"
        @remove="emit('removeField', 'fullName')"
      />

      <CvSingleBadge
        v-if="profile.headline"
        :label="t('cvUpload.profile.headline')"
        :value="profile.headline"
        @remove="emit('removeField', 'headline')"
      />

      <CvSingleBadge
        v-if="profile.location"
        :label="t('cvUpload.profile.location')"
        :value="profile.location"
        @remove="emit('removeField', 'location')"
      />

      <CvSingleBadge
        v-if="profile.seniorityLevel"
        :label="t('cvUpload.profile.seniorityLevel')"
        :value="profile.seniorityLevel"
        @remove="emit('removeField', 'seniorityLevel')"
      />

      <!-- Array fields -->
      <CvBadgeList
        v-if="profile.aspirations && profile.aspirations.length > 0"
        :label="t('cvUpload.profile.aspirations')"
        :items="profile.aspirations"
        @remove="(index: number) => emit('removeArrayItem', 'aspirations', index)"
      />

      <CvBadgeList
        v-if="profile.personalValues && profile.personalValues.length > 0"
        :label="t('cvUpload.profile.personalValues')"
        :items="profile.personalValues"
        @remove="(index: number) => emit('removeArrayItem', 'personalValues', index)"
      />

      <CvBadgeList
        v-if="profile.strengths && profile.strengths.length > 0"
        :label="t('cvUpload.profile.strengths')"
        :items="profile.strengths"
        @remove="(index: number) => emit('removeArrayItem', 'strengths', index)"
      />

      <CvBadgeList
        v-if="profile.interests && profile.interests.length > 0"
        :label="t('cvUpload.profile.interests')"
        :items="profile.interests"
        @remove="(index: number) => emit('removeArrayItem', 'interests', index)"
      />

      <CvBadgeList
        v-if="profile.languages && profile.languages.length > 0"
        :label="t('cvUpload.profile.languages')"
        :items="profile.languages"
        @remove="(index: number) => emit('removeArrayItem', 'languages', index)"
      />
    </div>
  </UCard>
</template>
