<template>
  <Authenticator :initial-state="initialState" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-vue';
import { AUTHENTICATED_HOME } from '@/utils/authRouting';
import { useAuthState } from '@/composables/useAuthState';
import '@aws-amplify/ui-vue/styles.css';

definePageMeta({
  layout: 'public',
});

const auth = useAuthenticator();
const router = useRouter();
const route = useRoute();
const authState = useAuthState();

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
