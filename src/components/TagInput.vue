<script setup lang="ts">
import { ref, computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

interface Props {
  modelValue: string[];
  label: string;
  placeholder?: string;
  hint?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  required?: boolean;
  disabled?: boolean;
  testId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  hint: '',
  color: 'primary',
  required: false,
  disabled: false,
  testId: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const attrs = useAttrs();
const inputValue = ref('');
const inputTestId = computed(() => (props.testId ? `${props.testId}-input` : undefined));
const tagsTestId = computed(() => (props.testId ? `${props.testId}-tags` : undefined));

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

<template>
  <div v-bind="attrs" class="space-y-2">
    <UFormField :label="label" :hint="hint" :required="required">
      <UInput
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :data-testid="inputTestId"
        @keydown="handleKeydown"
      />
    </UFormField>
    <div
      v-if="modelValue.length > 0"
      class="flex flex-wrap gap-2"
      :data-testid="tagsTestId"
    >
      <UBadge v-for="(item, index) in modelValue" :key="index" :color="color" variant="subtle">
        {{ item }}
        <UButton
          v-if="!disabled"
          icon="i-heroicons-x-mark-20-solid"
          size="xs"
          :color="color"
          variant="link"
          :padded="false"
          @click="handleRemove(index)"
        />
      </UBadge>
    </div>
  </div>
</template>
