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
    <UText size="sm" weight="medium">{{ label }}:</UText>
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
          size="xs"
          color="error"
          variant="ghost"
          class="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="emit('remove', index)"
        />
      </UBadge>
    </div>
  </div>
</template>
