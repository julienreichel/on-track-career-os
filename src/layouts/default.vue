<template>
  <UContainer>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="font-semibold hover:opacity-80 transition-opacity">
          {{ t('app.title') }}
        </NuxtLink>
      </template>

      <template #right>
        <UButton variant="ghost" @click="handleSignOut">
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
import { computed, ref, watch } from 'vue';
import { useBreadcrumbMapping } from '@/composables/useBreadcrumbMapping';

const { t } = useI18n();
const route = useRoute();
const { resolveSegment, isUUID } = useBreadcrumbMapping();

// Reactive breadcrumb items that update when IDs are resolved
const breadcrumbItems = ref<Array<{ label: string; to: string; icon?: string }>>([]);

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
const generateBreadcrumbs = async () => {
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
    const previousSegment = i > 0 ? pathSegments[i - 1] : undefined;

    // Check if this is the last segment and we have a custom breadcrumb label from page meta
    if (i === pathSegments.length - 1 && route.meta.breadcrumbLabel) {
      items.push({
        label: String(route.meta.breadcrumbLabel),
        to: currentPath,
      });
      continue;
    }

    // Try to resolve ID segments to names
    if (isUUID(segment)) {
      const resolvedName = await resolveSegment(segment, previousSegment);
      if (resolvedName) {
        items.push({
          label: resolvedName,
          to: currentPath,
        });
        continue;
      }
    }

    // Map route segments to translation keys or use the segment itself
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
    } else if (segment === 'new') {
      label = t('navigation.new');
    } else if (segment === 'stories') {
      label = t('stories.list.title');
    }

    items.push({
      label,
      to: currentPath,
    });
  }

  breadcrumbItems.value = items;
};

// Watch route changes and regenerate breadcrumbs
watch(
  () => [route.path, route.meta.breadcrumbLabel],
  async () => {
    await generateBreadcrumbs();
  },
  { immediate: true }
);

// Only show breadcrumb on non-home pages
const showBreadcrumb = computed(() => route.path !== '/');
</script>
