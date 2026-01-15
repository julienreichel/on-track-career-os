<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard.vue';

const { t } = useI18n();

defineOptions({
  name: 'OnboardingPage',
});

definePageMeta({
  breadcrumbLabel: 'Onboarding',
});

useHead({
  title: t('onboarding.title'),
});
</script>

<template>
  <OnboardingWizard />
</template>
