<template>
  <UContainer>
    <UHeader>
      <template #left>
        <div class="flex items-center gap-4">
          <NavigationMenu />
          <NuxtLink to="/" class="font-semibold hover:opacity-80 transition-opacity">
            {{ t('app.title') }}
          </NuxtLink>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            icon="i-heroicons-cog-6-tooth"
            :label="t('navigation.settings')"
            to="/settings/cv"
          />
          <UButton variant="ghost" @click="handleSignOut">
            {{ t('auth.signOut') }}
          </UButton>
        </div>
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

// Map route segments to their translated labels
const getSegmentLabel = (segment: string): string => {
  const segmentMap: Record<string, string> = {
    profile: t('navigation.profile'),
    'cv-upload': t('navigation.cvUpload'),
    experiences: t('navigation.experiences'),
    settings: t('navigation.settings'),
    jobs: t('navigation.jobs'),
    companies: t('navigation.companies'),
    applications: t('navigation.applications'),
    'cover-letters': t('navigation.coverLetters'),
    speech: t('navigation.speech'),
    interview: t('navigation.interview'),
    cv: t('navigation.cv'),
    stories: t('stories.list.title'),
  };
  return segmentMap[segment] || segment;
};

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
  const parentSegmentOffset = 2;
  for (let i = 0; i < pathSegments.length; i++) {
    currentPath += `/${pathSegments[i]}`;
    const segment = pathSegments[i];
    const previousSegment = i > 0 ? pathSegments[i - 1] : undefined;
    const previousParentSegment = i > 1 ? pathSegments[i - parentSegmentOffset] : undefined;

    // Try to resolve ID segments to names first
    if (segment && isUUID(segment)) {
      const resolvedName = await resolveSegment(segment, previousSegment, previousParentSegment);
      if (resolvedName) {
        items.push({
          label: resolvedName,
          to: currentPath,
        });
        continue;
      }
    }

    // Check if this is the last segment and we have a custom breadcrumb label from page meta
    if (i === pathSegments.length - 1 && route.meta.breadcrumbLabel) {
      items.push({
        label: String(route.meta.breadcrumbLabel),
        to: currentPath,
      });
      continue;
    }

    // Use the mapped label for the segment
    const label = getSegmentLabel(segment ?? '');
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

// Generate page title from breadcrumb items (excluding Home icon)
const pageTitle = computed(() => {
  // Skip the first item (Home) and get labels
  const labels = breadcrumbItems.value.slice(1).map((item) => item.label);

  if (labels.length === 0) {
    // Home page
    return t('app.title');
  }

  // Join with " | " and append app title
  return `${labels.join(' | ')} | ${t('app.title')}`;
});

// Update document title reactively
useHead({
  title: pageTitle,
});
</script>
