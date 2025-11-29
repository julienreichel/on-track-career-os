<template>
  <UContainer>
    <UHeader>
      <template #left>
        <span>{{ t('app.title') }}</span>
      </template>

      <template #right>
        <UButton @click="handleSignOut">
          {{ t('auth.signOut') }}
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </UContainer>
</template>

<script setup lang="ts">
// Default layout with header and sign out

const { t } = useI18n();

const handleSignOut = async () => {
  try {
    const { $Amplify } = useNuxtApp();
    if (!$Amplify?.Auth?.signOut) {
      console.error('Amplify Auth is not initialized');
      return;
    }
    await $Amplify.Auth.signOut();
    await navigateTo('/login');
  } catch (error) {
    console.error(t('auth.errorSigningOut'), error);
  }
};
</script>
