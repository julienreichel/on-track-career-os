<template>
  <UCard v-if="isEditing || hasIdentityValues" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.identityValues') }}
      </h3>
    </template>

    <div class="space-y-4">
      <TagInput
        v-if="isEditing || form.personalValues.length > 0"
        v-model="form.personalValues"
        :label="t('profile.fields.personalValues')"
        :placeholder="isEditing ? t('profile.fields.personalValuesPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.personalValuesHint') : ''"
        color="info"
        :editable="isEditing"
      />

      <TagInput
        v-if="isEditing || form.strengths.length > 0"
        v-model="form.strengths"
        :label="t('profile.fields.strengths')"
        :placeholder="isEditing ? t('profile.fields.strengthsPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.strengthsHint') : ''"
        color="info"
        :editable="isEditing"
      />

      <TagInput
        v-if="isEditing || form.interests.length > 0"
        v-model="form.interests"
        :label="t('profile.fields.interests')"
        :placeholder="isEditing ? t('profile.fields.interestsPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.interestsHint') : ''"
        color="info"
        :editable="isEditing"
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
