<template>
  <Authenticator :initial-state="initialState" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-vue';
import { AUTHENTICATED_HOME } from '@/utils/authRouting';
import { useAuthState } from '@/composables/useAuthState';
import { useSeoMetaDefaults } from '@/composables/useSeoMetaDefaults';
import { buildAbsoluteUrl } from '@/utils/url';
import amplifyUiStylesHref from '@aws-amplify/ui-vue/styles.css?url';

definePageMeta({
  layout: 'public',
});

const auth = useAuthenticator();
const router = useRouter();
const route = useRoute();
const authState = useAuthState();
const { siteName, baseUrl, ogImage, titleTemplate } = useSeoMetaDefaults();

const title = 'Sign in or create an account';
const description = 'Access your On Track Career workspace or create a new account.';
const canonicalUrl = buildAbsoluteUrl(baseUrl, '/login');
const ogImageUrl = buildAbsoluteUrl(baseUrl, ogImage);

useHead({
  titleTemplate,
  link: [
    { rel: 'canonical', href: canonicalUrl },
    { rel: 'stylesheet', href: amplifyUiStylesHref, key: 'amplify-ui-styles' },
  ],
});

useSeoMeta({
  title,
  description,
  ogTitle: `${title} | ${siteName}`,
  ogDescription: description,
  ogType: 'website',
  ogImage: ogImageUrl,
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: `${title} | ${siteName}`,
  twitterDescription: description,
  twitterImage: ogImageUrl,
});

const initialState = computed(() => (route.query.mode === 'signup' ? 'signUp' : 'signIn'));

watch(auth, () => {
  if (auth.authStatus === 'authenticated') {
    void router.push(AUTHENTICATED_HOME);
  }
});

watch(
  () => authState.isAuthenticated.value,
  async (isAuthenticated) => {
    if (!isAuthenticated) {
      return;
    }
    await router.replace(AUTHENTICATED_HOME);
  },
  { immediate: true }
);
</script>

<style></style>
