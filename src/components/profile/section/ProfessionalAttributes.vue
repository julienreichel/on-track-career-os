<template>
  <UCard v-if="isEditing || hasProfessionalAttributes" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.professionalAttributes') }}
      </h3>
    </template>

    <div v-if="!isEditing" class="space-y-4">
      <div v-if="form.skills.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.skills') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="(skill, index) in form.skills" :key="index" color="success" variant="subtle">
            {{ skill }}
          </UBadge>
        </div>
      </div>

      <div v-if="form.certifications.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.certifications') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(cert, index) in form.certifications"
            :key="index"
            color="success"
            variant="subtle"
          >
            {{ cert }}
          </UBadge>
        </div>
      </div>

      <div v-if="form.languages.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.languages') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(lang, index) in form.languages"
            :key="index"
            color="success"
            variant="subtle"
          >
            {{ lang }}
          </UBadge>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <TagInput
        v-model="form.skills"
        :label="t('profile.fields.skills')"
        :placeholder="t('profile.fields.skillsPlaceholder')"
        :hint="t('profile.fields.skillsHint')"
        color="success"
      />

      <TagInput
        v-model="form.certifications"
        :label="t('profile.fields.certifications')"
        :placeholder="t('profile.fields.certificationsPlaceholder')"
        :hint="t('profile.fields.certificationsHint')"
        color="success"
      />

      <TagInput
        v-model="form.languages"
        :label="t('profile.fields.languages')"
        :placeholder="t('profile.fields.languagesPlaceholder')"
        :hint="t('profile.fields.languagesHint')"
        color="success"
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
  name: 'ProfileSectionProfessionalAttributes',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileProfessionalAttributesSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasProfessionalAttributes } = context;
</script>
