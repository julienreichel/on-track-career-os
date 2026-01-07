<script setup lang="ts">
interface Props {
  count?: number;
}

withDefaults(defineProps<Props>(), {
  count: 3,
});
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <UCard v-for="index in count" :key="index">
      <div class="space-y-3">
        <USkeleton class="h-5 w-3/4" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
      </div>
    </UCard>
  </div>
</template>
