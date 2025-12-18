<template>
  <UCard v-if="isEditing || hasSocialLinks" class="mb-6">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ t('profile.sections.socialLinks') }}
      </h3>
    </template>

    <div v-if="!isEditing" class="space-y-2">
      <div v-if="form.socialLinks.length === 0" class="text-sm text-gray-500">
        {{ t('profile.fields.socialLinksEmpty') }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="(link, index) in form.socialLinks"
          :key="`social-display-${index}`"
          class="flex items-center gap-2"
        >
          <UIcon name="i-heroicons-link" class="text-primary-500" />
          <a
            class="text-primary-600 dark:text-primary-400 truncate"
            target="_blank"
            rel="noopener noreferrer"
            :href="formatSocialLink(link)"
          >
            {{ link }}
          </a>
        </li>
      </ul>
    </div>

    <div v-else>
      <TagInput
        v-model="form.socialLinks"
        :label="t('profile.fields.socialLinks')"
        :placeholder="t('profile.fields.socialUrlPlaceholder')"
        :hint="t('profile.fields.socialLinksHint')"
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
  name: 'ProfileSectionSocialLinks',
});

const context = inject(profileFormContextKey);

if (!context) {
  throw new Error('ProfileSocialLinksSection used without provider');
}

const { t } = useI18n();
const { form, isEditing, hasSocialLinks, formatSocialLink } = context;
</script>
