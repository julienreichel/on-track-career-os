<template>
  <UCard>
    <div class="flex flex-col gap-6 md:flex-row md:items-center">
      <div class="flex items-center gap-4">
        <UAvatar
          size="xl"
          class="ring-2 ring-primary-100 dark:ring-primary-900"
          :src="photoUrl || undefined"
          :alt="profile?.fullName || t('profile.fields.fullName')"
          icon="i-heroicons-user-circle"
        />
        <div>
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ profile?.fullName || t('profile.summary.emptyName') }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ profile?.headline || t('profile.summary.emptyHeadline') }}
          </p>
          <p v-if="profile?.location" class="text-xs text-gray-500">
            {{ profile.location }}
          </p>
        </div>
      </div>

      <div class="flex-1">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
            {{ t('profile.summary.careerDirection') }}
          </p>
          <UBadge v-if="profile?.seniorityLevel" color="primary" variant="soft">
            {{ profile.seniorityLevel }}
          </UBadge>
        </div>
        <p v-if="careerDirectionSummary.length === 0" class="text-sm text-gray-500 mt-2">
          {{ t('profile.summary.careerDirectionEmpty') }}
        </p>
        <ul v-else class="mt-2 list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
          <li v-for="(item, index) in careerDirectionSummary" :key="`dir-${index}`">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { UserProfile } from '@/domain/user-profile/UserProfile';

const props = defineProps<{
  profile: UserProfile | null;
  photoUrl: string | null;
}>();

const { t } = useI18n();

const CAREER_DIRECTION_LIMIT = 3;

const careerDirectionSummary = computed(() => {
  const goals = props.profile?.goals || [];
  const aspirations = props.profile?.aspirations || [];
  return [...goals, ...aspirations].slice(0, CAREER_DIRECTION_LIMIT);
});
</script>
