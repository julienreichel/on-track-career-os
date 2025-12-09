<script setup lang="ts">
interface Props {
  label: string;
  value: string;
}

defineProps<Props>();

const emit = defineEmits<{
  remove: [];
}>();
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}:</p>
    <UBadge color="primary" variant="subtle" class="group">
      <span>{{ value }}</span>
      <UButton
        icon="i-lucide-x"
        size="2xs"
        color="red"
        variant="ghost"
        class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        @click="emit('remove')"
      />
    </UBadge>
  </div>
</template>
