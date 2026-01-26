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
  editable?: boolean;
  single?: boolean;
  testId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  hint: '',
  color: 'primary',
  required: false,
  disabled: false,
  editable: true,
  single: false,
  testId: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const attrs = useAttrs();
const inputValue = ref('');
const inputTestId = computed(() => (props.testId ? `${props.testId}-input` : undefined));
const tagsTestId = computed(() => (props.testId ? `${props.testId}-tags` : undefined));
const showInput = computed(() => {
  if (!props.editable) return false;
  if (!props.single) return true;
  return props.modelValue.length === 0;
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleAdd();
  }
};

const handleBlur = () => {
  handleAdd();
};

const handleAdd = () => {
  const rawValue = inputValue.value.trim();
  if (!rawValue) return;

  const colonIndex = rawValue.indexOf(':');
  const splitSource =
    colonIndex === -1
      ? rawValue
      : rawValue.slice(0, colonIndex).replace(/[;,]+$/, '').trim();
  const suffix = colonIndex === -1 ? '' : rawValue.slice(colonIndex);
  const tokens: string[] = splitSource
    .split(/[;,]/)
    .map((token) => token.trim())
    .filter((token): token is string => Boolean(token));

  if (colonIndex !== -1) {
    if (tokens.length > 0) {
      tokens[tokens.length - 1] = `${tokens[tokens.length - 1]}${suffix}`;
    } else if (suffix.trim()) {
      tokens.push(suffix.trim());
    }
  }

  if (tokens.length === 0) return;

  const firstToken = tokens[0];
  if (!firstToken) return;

  const updated = props.single ? [firstToken] : [...props.modelValue, ...tokens];
  emit('update:modelValue', updated);
  inputValue.value = '';
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
        v-if="showInput"
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-xs"
        :data-testid="inputTestId"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />
    </UFormField>
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2" :data-testid="tagsTestId">
      <UBadge v-for="(item, index) in modelValue" :key="index" :color="color" variant="subtle">
        {{ item }}
        <UButton
          v-if="editable && !disabled"
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
