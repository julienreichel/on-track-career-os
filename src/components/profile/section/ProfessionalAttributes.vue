<template>
  <UCard v-if="isEditing || hasProfessionalAttributes" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.professionalAttributes') }}
      </h3>
    </template>

    <div class="space-y-4">
      <TagInput
        v-if="isEditing || form.skills.length > 0"
        v-model="form.skills"
        :label="t('profile.fields.skills')"
        :placeholder="isEditing ? t('profile.fields.skillsPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.skillsHint') : ''"
        color="success"
        :editable="isEditing"
      />

      <TagInput
        v-if="isEditing || form.certifications.length > 0"
        v-model="form.certifications"
        :label="t('profile.fields.certifications')"
        :placeholder="isEditing ? t('profile.fields.certificationsPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.certificationsHint') : ''"
        color="success"
        :editable="isEditing"
      />

      <TagInput
        v-if="isEditing || form.languages.length > 0"
        v-model="form.languages"
        :label="t('profile.fields.languages')"
        :placeholder="isEditing ? t('profile.fields.languagesPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.languagesHint') : ''"
        color="success"
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
  name: 'ProfileSectionProfessionalAttributes',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileProfessionalAttributesSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasProfessionalAttributes } = context;
</script>
