<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon :name="icon" class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold">{{ title }}</h3>
      </div>
    </template>
    <UTextarea
      v-if="isEditing"
      :model-value="editValue"
      :rows="4"
      :placeholder="placeholder"
      class="w-full"
      @update:model-value="$emit('update:editValue', $event)"
    />
    <ul
      v-else-if="Array.isArray(items) && items.length > 0"
      class="space-y-1 text-sm"
    >
      <li v-for="(item, idx) in items" :key="idx">{{ item }}</li>
    </ul>
    <p v-else class="text-sm text-gray-500">{{ emptyText }}</p>
  </UCard>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NullableStringArray = any;

interface Props {
  icon: string;
  title: string;
  items: NullableStringArray;
  isEditing: boolean;
  editValue: string;
  placeholder: string;
  emptyText: string;
}

defineProps<Props>();

defineEmits<{
  'update:editValue': [value: string];
}>();
</script>
