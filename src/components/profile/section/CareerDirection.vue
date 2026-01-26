<template>
  <UCard v-if="isEditing || hasCareerDirection" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.careerDirection') }}
      </h3>
    </template>

    <div class="space-y-4">
      <TagInput
        v-if="isEditing || form.aspirations.length > 0"
        v-model="form.aspirations"
        :label="t('profile.fields.aspirations')"
        :placeholder="isEditing ? t('profile.fields.aspirationsPlaceholder') : ''"
        :hint="isEditing ? t('profile.fields.aspirationsHint') : ''"
        color="primary"
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
  name: 'ProfileSectionCareerDirection',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileCareerDirectionSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasCareerDirection } = context;
</script>
