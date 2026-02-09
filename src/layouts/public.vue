<template>
  <UMain>
    <UContainer>
      <slot />
    </UContainer>
  </UMain>
</template>

<script setup lang="ts">
// Public layout for unauthenticated pages (landing, auth).
defineOptions({ name: 'PublicLayout' });
</script>
