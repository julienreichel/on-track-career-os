<template>
  <div class="cv-editor-page">
    <CvRenderEditor
      :cv-id="cvId"
      :user-id="userId"
      :selected-experience-ids="selectedExperienceIds"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Get current user ID (you'll need to implement this based on your auth setup)
const userId = computed(() => ''); // TODO: Get from auth context

const cvId = computed(() => route.params.id as string);

const selectedExperienceIds = computed((): string[] => {
  const experiences = route.query.experiences;
  if (!experiences) return [];

  // Handle string (single value or comma-separated)
  if (typeof experiences === 'string') {
    return experiences.split(',').filter((id) => id.trim() !== '');
  }

  // Handle array - filter out nulls and empty strings
  if (Array.isArray(experiences)) {
    return experiences.filter((id): id is string => typeof id === 'string' && id.trim() !== '');
  }

  return [];
});
</script>
