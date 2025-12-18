<template>
  <UCard v-if="isEditing || hasContactInfo" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.contactInfo') }}
      </h3>
    </template>

    <div v-if="!isEditing" class="space-y-4">
      <div v-if="form.primaryEmail">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.primaryEmail') }}
        </label>
        <a class="text-primary-600 dark:text-primary-400" :href="`mailto:${form.primaryEmail}`">
          {{ form.primaryEmail }}
        </a>
      </div>
      <div v-if="form.primaryPhone">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('profile.fields.primaryPhone') }}
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ form.primaryPhone }}
        </p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <UFormField :label="t('profile.fields.primaryEmail')" :error="emailError">
        <UInput
          v-model="form.primaryEmail"
          type="email"
          :placeholder="t('profile.fields.emailPlaceholder')"
        />
      </UFormField>

      <UFormField :label="t('profile.fields.primaryPhone')" :error="phoneError">
        <UInput v-model="form.primaryPhone" :placeholder="t('profile.fields.phonePlaceholder')" />
      </UFormField>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { profileFormContextKey } from '@/components/profile/profileFormContext';

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileContactSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasContactInfo, emailError, phoneError } = context;
</script>
