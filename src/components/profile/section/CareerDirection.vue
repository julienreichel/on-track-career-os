<template>
  <UCard v-if="isEditing || hasCareerDirection" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.careerDirection') }}
      </h3>
    </template>

    <div v-if="!isEditing" class="space-y-4">
      <div v-if="form.aspirations.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.aspirations') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(aspiration, index) in form.aspirations"
            :key="index"
            color="primary"
            variant="subtle"
          >
            {{ aspiration }}
          </UBadge>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <TagInput
        v-model="form.aspirations"
        :label="t('profile.fields.aspirations')"
        :placeholder="t('profile.fields.aspirationsPlaceholder')"
        :hint="t('profile.fields.aspirationsHint')"
        color="primary"
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
