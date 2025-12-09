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
    <UText size="sm" weight="medium">{{ label }}:</UText>
    <UBadge color="primary" variant="subtle" class="group">
      <span>{{ value }}</span>
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="error"
        variant="ghost"
        class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        @click="emit('remove')"
      />
    </UBadge>
  </div>
</template>
