<template>
  <div class="flex items-center gap-1">
    <UDropdown
      v-for="link in navigationLinks"
      :key="link.label"
      :items="[link.children || []]"
      :popper="{ placement: 'bottom-start' }"
    >
      <UButton
        :label="link.label"
        variant="ghost"
        :icon="link.icon"
        :to="link.to"
        trailing-icon="i-heroicons-chevron-down-20-solid"
      />
    </UDropdown>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

interface NavigationLink {
  label: string;
  to?: string;
  children?: Array<{ label: string; to: string }>;
  icon?: string;
}

const navigationLinks = computed<NavigationLink[]>(() => [
  {
    label: t('navigation.profile'),
    to: '/profile',
    icon: 'i-heroicons-user',
    children: [
      {
        label: t('navigation.experiences'),
        to: '/profile/experiences',
      },
      {
        label: t('navigation.stories'),
        to: '/profile/stories',
      },
      {
        label: t('navigation.personalCanvas'),
        to: '/profile/canvas',
      },
    ],
  },
  {
    label: t('navigation.jobs'),
    to: '/jobs',
    icon: 'i-heroicons-briefcase',
    children: [
      {
        label: t('navigation.companies'),
        to: '/companies',
      },
    ],
  },
  {
    label: t('navigation.applications'),
    icon: 'i-heroicons-document-text',
    children: [
      {
        label: t('navigation.cvs'),
        to: '/applications/cv',
      },
      {
        label: t('navigation.coverLetters'),
        to: '/applications/cover-letters',
      },
      {
        label: t('navigation.speeches'),
        to: '/applications/speech',
      },
    ],
  },
]);
</script>
