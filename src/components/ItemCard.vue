<script setup lang="ts">
import { useSlots } from 'vue';

defineProps<{
  /**
   * Main title displayed in the card header
   */
  title: string;
  /**
   * Optional subtitle displayed below the title in header
   */
  subtitle?: string;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const slots = useSlots();

const handleEdit = (event: Event) => {
  event.stopPropagation();
  emit('edit');
};

const handleDelete = (event: Event) => {
  event.stopPropagation();
  emit('delete');
};
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="space-y-2">
        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
          {{ title }}
        </h3>
        <!-- Optional Subtitle -->
        <div v-if="subtitle" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ subtitle }}
        </div>
      </div>
    </template>

    <!-- Content Area - grows to fill space -->
    <div class="flex-grow">
      <slot />
    </div>

    <template #footer>
      <div class="space-y-3">
        <!-- Optional Badges Slot -->
        <div v-if="slots.badges" class="flex items-center gap-2">
          <slot name="badges" />
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center justify-between gap-2">
          <!-- Left Side Actions -->
          <div v-if="slots.actions" class="flex gap-2">
            <slot name="actions" />
          </div>

          <!-- Default Actions if no custom actions provided -->
          <div v-else class="flex gap-2">
            <UButton
              :label="$t('common.edit')"
              icon="i-heroicons-pencil"
              size="xs"
              color="primary"
              variant="soft"
              @click="handleEdit"
            />
          </div>

          <!-- Right Side - Delete Button -->
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="error"
            variant="ghost"
            @click="handleDelete"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
