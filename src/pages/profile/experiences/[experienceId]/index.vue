<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ExperienceService } from '@/domain/experience/ExperienceService';

const route = useRoute();
const router = useRouter();
const experienceService = new ExperienceService();

const experienceId = computed(() => route.params.experienceId as string);
const experienceTitle = ref<string>('');

// Load experience and set breadcrumb
onMounted(async () => {
  try {
    const experience = await experienceService.getFullExperience(experienceId.value);
    if (experience) {
      experienceTitle.value = experience.title;
    }
  } catch (err) {
    console.error('[Experience] Error loading experience:', err);
  }
});

// Update breadcrumb label when experience loads
watch(
  () => experienceTitle.value,
  (title) => {
    if (title) {
      route.meta.breadcrumbLabel = title;
    }
  },
  { immediate: true }
);

// Redirect to stories page
onMounted(() => {
  router.replace(`/profile/experiences/${experienceId.value}/stories`);
});
</script>

<template>
  <div />
</template>
