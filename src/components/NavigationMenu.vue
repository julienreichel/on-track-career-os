<template>
  <UNavigationMenu 
    :items="navigationLinks" 
    orientation="horizontal"
  />
</template>

<script setup lang="ts">
const { t } = useI18n();

interface NavigationLink {
  label: string;
  to?: string;
  children?: NavigationLink[];
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
