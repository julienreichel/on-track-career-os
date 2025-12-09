<template>
  <UContainer>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="font-semibold hover:opacity-80 transition-opacity">
          {{ t('app.title') }}
        </NuxtLink>
      </template>

      <template #right>
        <UButton @click="handleSignOut" variant="ghost">
          {{ t('auth.signOut') }}
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <div v-if="showBreadcrumb" class="mb-6">
        <UBreadcrumb :items="breadcrumbItems" />
      </div>
      <slot />
    </UMain>
  </UContainer>
</template>

<script setup lang="ts">
// Default layout with header and sign out

const { t } = useI18n();
const route = useRoute();

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

// Generate breadcrumb items based on current route
const breadcrumbItems = computed(() => {
  const items = [];
  const pathSegments = route.path.split('/').filter(Boolean);

  // Always add home
  items.push({
    label: t('navigation.home'),
    to: '/',
    icon: 'i-heroicons-home',
  });

  // Build breadcrumb from path segments
  let currentPath = '';
  for (let i = 0; i < pathSegments.length; i++) {
    currentPath += `/${pathSegments[i]}`;
    const segment = pathSegments[i];

    // Map route segments to translation keys
    let label = segment;
    if (segment === 'profile') {
      label = t('navigation.profile');
    } else if (segment === 'cv-upload') {
      label = t('navigation.cvUpload');
    } else if (segment === 'experiences') {
      label = t('navigation.experiences');
    } else if (segment === 'jobs') {
      label = t('navigation.jobs');
    } else if (segment === 'companies') {
      label = t('navigation.companies');
    } else if (segment === 'applications') {
      label = t('navigation.applications');
    } else if (segment === 'interview') {
      label = t('navigation.interview');
    }

    items.push({
      label,
      to: currentPath,
    });
  }

  return items;
});

// Only show breadcrumb on non-home pages
const showBreadcrumb = computed(() => route.path !== '/');
</script>
