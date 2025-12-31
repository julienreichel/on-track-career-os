<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [string];
}>();

const { t } = useI18n();

const value = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
});
</script>

<template>
  <UFormField :label="t('companies.notes.label')" :hint="t('companies.notes.hint')">
    <UTextarea
      v-model="value"
      :placeholder="t('companies.notes.placeholder')"
      :rows="6"
      :disabled="disabled"
      class="w-full"
    />
  </UFormField>
</template>
