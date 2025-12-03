<template>
  <UFormField :label="label" :hint="hint" :required="required">
    <UInput v-model="inputValue" :placeholder="placeholder" @keydown="handleKeydown" />
    <div v-if="modelValue.length > 0" class="mt-2 flex flex-wrap gap-2">
      <UBadge v-for="(item, index) in modelValue" :key="index" :color="color" variant="subtle">
        {{ item }}
        <UButton
          icon="i-heroicons-x-mark-20-solid"
          size="xs"
          :color="color"
          variant="link"
          :padded="false"
          @click="handleRemove(index)"
        />
      </UBadge>
    </div>
  </UFormField>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  modelValue: string[];
  label: string;
  placeholder?: string;
  hint?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  hint: '',
  color: 'primary',
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const inputValue = ref('');

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleAdd();
  }
};

const handleAdd = () => {
  if (inputValue.value.trim()) {
    emit('update:modelValue', [...props.modelValue, inputValue.value.trim()]);
    inputValue.value = '';
  }
};

const handleRemove = (index: number) => {
  const newValue = [...props.modelValue];
  newValue.splice(index, 1);
  emit('update:modelValue', newValue);
};
</script>
