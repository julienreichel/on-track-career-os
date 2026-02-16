<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    retryLabel?: string;
    showRetry?: boolean;
    testId?: string;
  }>(),
  {
    description: '',
    retryLabel: '',
    showRetry: true,
    testId: undefined,
  }
);

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <UCard :data-testid="props.testId">
    <div class="space-y-3">
      <h3 class="text-base font-semibold text-highlighted">{{ props.title }}</h3>
      <p v-if="props.description" class="text-sm text-dimmed">{{ props.description }}</p>
      <UButton
        v-if="props.showRetry"
        color="neutral"
        variant="outline"
        icon="i-heroicons-arrow-path"
        :label="props.retryLabel"
        @click="emit('retry')"
      />
    </div>
  </UCard>
</template>
