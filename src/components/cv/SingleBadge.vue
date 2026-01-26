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
    <label class="text-sm font-medium">{{ label }}:</label>
    <UBadge color="primary" variant="subtle" class="group">
      <span>{{ value }}</span>
      <UButton
        icon="i-heroicons-x-mark-20-solid"
        size="xs"
        color="primary"
        variant="link"
        :padded="false"
        @click="emit('remove')"
      />
    </UBadge>
  </div>
</template>
