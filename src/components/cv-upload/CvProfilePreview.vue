<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';

const { t } = useI18n();

interface Props {
  profile: ParseCvTextOutput['profile'];
}

defineProps<Props>();

const emit = defineEmits<{
  removeField: [field: string];
  removeArrayItem: [field: string, index: number];
}>();

function hasProfileData(profile: ParseCvTextOutput['profile']): boolean {
  return Boolean(
    profile.fullName ||
    profile.headline ||
    profile.location ||
    profile.seniorityLevel ||
    (profile.goals && profile.goals.length > 0) ||
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
        {{ t('profile.cvUpload.profile.title') }}
      </h3>
    </template>

    <div class="space-y-4">
      <!-- Single value fields -->
      <CvSingleBadge
        v-if="profile.fullName"
        :label="t('profile.cvUpload.profile.fullName')"
        :value="profile.fullName"
        @remove="emit('removeField', 'fullName')"
      />

      <CvSingleBadge
        v-if="profile.headline"
        :label="t('profile.cvUpload.profile.headline')"
        :value="profile.headline"
        @remove="emit('removeField', 'headline')"
      />

      <CvSingleBadge
        v-if="profile.location"
        :label="t('profile.cvUpload.profile.location')"
        :value="profile.location"
        @remove="emit('removeField', 'location')"
      />

      <CvSingleBadge
        v-if="profile.seniorityLevel"
        :label="t('profile.cvUpload.profile.seniorityLevel')"
        :value="profile.seniorityLevel"
        @remove="emit('removeField', 'seniorityLevel')"
      />

      <!-- Array fields -->
      <CvBadgeList
        v-if="profile.goals && profile.goals.length > 0"
        :label="t('profile.cvUpload.profile.goals')"
        :items="profile.goals"
        @remove="(index) => emit('removeArrayItem', 'goals', index)"
      />

      <CvBadgeList
        v-if="profile.aspirations && profile.aspirations.length > 0"
        :label="t('profile.cvUpload.profile.aspirations')"
        :items="profile.aspirations"
        @remove="(index) => emit('removeArrayItem', 'aspirations', index)"
      />

      <CvBadgeList
        v-if="profile.personalValues && profile.personalValues.length > 0"
        :label="t('profile.cvUpload.profile.personalValues')"
        :items="profile.personalValues"
        @remove="(index) => emit('removeArrayItem', 'personalValues', index)"
      />

      <CvBadgeList
        v-if="profile.strengths && profile.strengths.length > 0"
        :label="t('profile.cvUpload.profile.strengths')"
        :items="profile.strengths"
        @remove="(index) => emit('removeArrayItem', 'strengths', index)"
      />

      <CvBadgeList
        v-if="profile.interests && profile.interests.length > 0"
        :label="t('profile.cvUpload.profile.interests')"
        :items="profile.interests"
        @remove="(index) => emit('removeArrayItem', 'interests', index)"
      />

      <CvBadgeList
        v-if="profile.languages && profile.languages.length > 0"
        :label="t('profile.cvUpload.profile.languages')"
        :items="profile.languages"
        @remove="(index) => emit('removeArrayItem', 'languages', index)"
      />
    </div>
  </UCard>
</template>
