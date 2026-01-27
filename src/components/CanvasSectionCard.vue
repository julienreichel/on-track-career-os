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
            :aria-label="t('canvas.aria.saveSection')"
            @click="$emit('save')"
          />
          <UButton
            v-if="isEditing"
            icon="i-heroicons-x-mark"
            size="xs"
            color="neutral"
            variant="ghost"
            :aria-label="t('canvas.aria.cancelEdit')"
            @click="$emit('cancel')"
          />
          <UButton
            v-if="!isEditing"
            icon="i-heroicons-pencil"
            size="xs"
            color="neutral"
            variant="ghost"
            :aria-label="t('canvas.aria.editSection')"
            @click="$emit('edit')"
          />
        </div>
      </div>
    </template>

    <!-- Content area that grows to fill available space -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Edit mode: TagInput -->
      <div v-if="isEditing" class="space-y-2">
        <UInput
          v-model="inputValue"
          :placeholder="placeholder"
          @keydown.enter.prevent="handleAdd"
        />
        <div v-if="editItems.length > 0" class="flex flex-wrap gap-2">
          <UBadge v-for="(item, index) in editItems" :key="index" color="primary" variant="subtle">
            {{ item }}
            <UButton
              icon="i-heroicons-x-mark-20-solid"
              size="xs"
              color="primary"
              variant="link"
              :padded="false"
              @click="handleRemove(index)"
            />
          </UBadge>
        </div>
      </div>

      <!-- Display mode: Tags only -->
      <div v-else class="flex-1 overflow-auto">
        <div v-if="Array.isArray(items) && items.length > 0" class="flex flex-wrap gap-2">
          <UBadge v-for="(item, idx) in items" :key="idx" color="neutral" variant="subtle">
            {{ item }}
          </UBadge>
        </div>
        <p v-else class="text-sm text-gray-500">{{ emptyText }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NullableStringArray = any;

interface Props {
  icon: string;
  title: string;
  items: NullableStringArray;
  isEditing: boolean;
  placeholder: string;
  emptyText: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:items': [value: string[]];
  edit: [];
  save: [];
  cancel: [];
}>();

// Local state for editing
const inputValue = ref('');
const editItems = ref<string[]>([]);

// Initialize editItems when entering edit mode
watch(
  () => props.isEditing,
  (newVal) => {
    if (newVal) {
      editItems.value = Array.isArray(props.items) ? [...props.items] : [];
    }
  },
  { immediate: true }
);

// Watch items prop changes
watch(
  () => props.items,
  (newItems) => {
    if (props.isEditing) {
      editItems.value = Array.isArray(newItems) ? [...newItems] : [];
    }
  }
);

const handleAdd = () => {
  if (inputValue.value.trim()) {
    editItems.value.push(inputValue.value.trim());
    emit('update:items', editItems.value);
    inputValue.value = '';
  }
};

const handleRemove = (index: number) => {
  editItems.value.splice(index, 1);
  emit('update:items', editItems.value);
};
</script>
