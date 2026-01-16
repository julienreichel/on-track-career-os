<script setup lang="ts">
type ChecklistItem = {
  gate: string;
  label: string;
  complete: boolean;
};

defineProps<{
  items: ChecklistItem[];
}>();
</script>

<template>
  <div class="space-y-2">
    <div v-for="item in items" :key="item.gate" class="flex items-start gap-2">
      <UIcon
        :name="item.complete ? 'i-heroicons-check-circle' : 'i-heroicons-minus-circle'"
        :class="item.complete ? 'text-success' : 'text-dimmed'"
      />
      <span class="text-sm text-default">{{ item.label }}</span>
    </div>
  </div>
</template>
