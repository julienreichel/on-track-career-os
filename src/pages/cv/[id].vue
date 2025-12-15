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

const selectedExperienceIds = computed(() => {
  const experiences = route.query.experiences;
  if (!experiences) return [];
  if (typeof experiences === 'string') {
    return experiences.split(',');
  }
  return experiences;
});
</script>
