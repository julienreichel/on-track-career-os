<template>
  <authenticator />
</template>

<script setup>
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-vue';
import '@aws-amplify/ui-vue/styles.css';

definePageMeta({
  layout: 'empty',
});

const auth = useAuthenticator();
const router = useRouter();

watch(auth, () => {
  if (auth.authStatus === 'authenticated') {
    router.push('/');
  }
});
</script>

<style></style>
