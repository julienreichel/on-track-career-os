<template>
  <UCard v-if="isEditing || hasIdentityValues" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.identityValues') }}
      </h3>
    </template>

    <div v-if="!isEditing" class="space-y-4">
      <div v-if="form.personalValues.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.personalValues') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(value, index) in form.personalValues"
            :key="index"
            color="info"
            variant="subtle"
          >
            {{ value }}
          </UBadge>
        </div>
      </div>

      <div v-if="form.strengths.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.strengths') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(strength, index) in form.strengths"
            :key="index"
            color="info"
            variant="subtle"
          >
            {{ strength }}
          </UBadge>
        </div>
      </div>

      <div v-if="form.interests.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.interests') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(interest, index) in form.interests"
            :key="index"
            color="info"
            variant="subtle"
          >
            {{ interest }}
          </UBadge>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <TagInput
        v-model="form.personalValues"
        :label="t('profile.fields.personalValues')"
        :placeholder="t('profile.fields.personalValuesPlaceholder')"
        :hint="t('profile.fields.personalValuesHint')"
        color="info"
      />

      <TagInput
        v-model="form.strengths"
        :label="t('profile.fields.strengths')"
        :placeholder="t('profile.fields.strengthsPlaceholder')"
        :hint="t('profile.fields.strengthsHint')"
        color="info"
      />

      <TagInput
        v-model="form.interests"
        :label="t('profile.fields.interests')"
        :placeholder="t('profile.fields.interestsPlaceholder')"
        :hint="t('profile.fields.interestsHint')"
        color="info"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import TagInput from '@/components/TagInput.vue';
import { profileFormContextKey } from '@/components/profile/profileFormContext';

defineOptions({
  name: 'ProfileSectionIdentityValues',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileIdentityValuesSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasIdentityValues } = context;
</script>
