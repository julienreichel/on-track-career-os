<template>
  <div>
    <UMain>
      <UContainer>
        <slot />
      </UContainer>
    </UMain>

    <USeparator />
    <UFooter>
      <template #left>
        <p class="text-sm text-muted">© {{ currentYear }} On Track Career</p>
      </template>

      <UNavigationMenu :items="footerItems" variant="link" />
    </UFooter>
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

// Public layout for unauthenticated pages (landing, auth).
defineOptions({ name: 'PublicLayout' });

const currentYear = new Date().getFullYear();
const footerItems: NavigationMenuItem[] = [
  {
    label: 'End User License Agreement',
    to: '/eula',
  },
];
</script>
