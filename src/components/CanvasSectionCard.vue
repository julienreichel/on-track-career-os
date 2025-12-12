<template>
  <UCard class="flex flex-col h-full">
    <template #header>
      <div class="relative">
        <div class="flex flex-col items-center text-center gap-2">
          <UIcon :name="icon" class="w-8 h-8 text-primary" />
          <h3 class="text-lg font-semibold">{{ title }}</h3>
        </div>
        <div class="absolute top-0 right-0 flex items-center gap-2">
          <UButton
            v-if="isEditing"
            icon="i-heroicons-check"
            size="xs"
            color="primary"
            variant="soft"
            @click="$emit('save')"
          />
          <UButton
            v-if="isEditing"
            icon="i-heroicons-x-mark"
            size="xs"
            color="gray"
            variant="ghost"
            @click="$emit('cancel')"
          />
          <UButton
            v-if="!isEditing"
            icon="i-heroicons-pencil"
            size="xs"
            color="gray"
            variant="ghost"
            @click="$emit('edit')"
          />
        </div>
      </div>
    </template>
    
    <!-- Content area that grows to fill available space -->
    <div class="flex-1 flex flex-col min-h-0">
      <UTextarea
        v-if="isEditing"
        :model-value="editValue"
        :rows="12"
        :placeholder="placeholder"
        class="w-full flex-1"
        @update:model-value="$emit('update:editValue', $event)"
      />
      <div v-else class="flex-1 overflow-auto">
        <ul v-if="Array.isArray(items) && items.length > 0" class="space-y-1 text-sm">
          <li v-for="(item, idx) in items" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="text-sm text-gray-500">{{ emptyText }}</p>
      </div>
    </div>
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
  edit: [];
  save: [];
  cancel: [];
}>();
</script>
