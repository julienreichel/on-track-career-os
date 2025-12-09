<script setup lang="ts">
interface Props {
  label: string;
  items: string[];
}

defineProps<Props>();

const emit = defineEmits<{
  remove: [index: number];
}>();
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}:</p>
    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="(item, index) in items"
        :key="index"
        color="primary"
        variant="subtle"
        class="group"
      >
        <span>{{ item }}</span>
        <UButton
          icon="i-lucide-x"
          size="2xs"
          color="red"
          variant="ghost"
          class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="emit('remove', index)"
        />
      </UBadge>
    </div>
  </div>
</template>
