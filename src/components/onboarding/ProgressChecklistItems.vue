<script setup lang="ts">
type ChecklistItem = {
  gate: string;
  label: string;
  complete: boolean;
  to?: string;
};

defineProps<{
  items: ChecklistItem[];
}>();
</script>

<template>
  <div class="space-y-1">
    <UButton
      v-for="item in items"
      :key="item.gate"
      :to="item.to"
      :leading-icon="item.complete ? 'i-heroicons-check-circle' : 'i-heroicons-minus-circle'"
      :label="item.label"
      variant="ghost"
      color="neutral"
      size="sm"
      :class="['justify-start', item.complete ? 'text-success' : 'text-dimmed']"
      block
    />
  </div>
</template>
