<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const experienceId = computed(() => route.params.experienceId as string);

// Redirect to stories page
onMounted(() => {
  void router.replace(`/profile/experiences/${experienceId.value}/stories`);
});
</script>

<template>
  <div />
</template>
