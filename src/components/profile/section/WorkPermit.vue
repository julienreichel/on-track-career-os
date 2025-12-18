<template>
  <UCard v-if="isEditing || hasWorkPermit" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.workPermit') }}
      </h3>
    </template>

    <div v-if="!isEditing">
      <p v-if="form.workPermitInfo" class="text-base text-gray-900 dark:text-gray-100">
        {{ form.workPermitInfo }}
      </p>
      <p v-else class="text-sm text-gray-500">
        {{ t('profile.fields.workPermitEmpty') }}
      </p>
    </div>

    <div v-else>
      <UFormField :label="t('profile.fields.workPermitInfo')">
        <UTextarea
          v-model="form.workPermitInfo"
          :rows="3"
          :placeholder="t('profile.fields.workPermitPlaceholder')"
        />
      </UFormField>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { profileFormContextKey } from '@/components/profile/profileFormContext';

defineOptions({
  name: 'ProfileSectionWorkPermit',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileWorkPermitSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasWorkPermit } = context;
</script>
