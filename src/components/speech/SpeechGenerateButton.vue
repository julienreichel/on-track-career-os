<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    hasContent?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    hasContent: false,
    loading: false,
    disabled: false,
  }
);

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n();

const label = computed(() => {
  if (props.loading) {
    return t('speech.editor.actions.generating');
  }
  return props.hasContent
    ? t('speech.editor.actions.regenerate')
    : t('speech.editor.actions.generate');
});
</script>

<template>
  <UButton
    color="primary"
    icon="i-heroicons-sparkles"
    :label="label"
    :loading="loading"
    :disabled="disabled || loading"
    @click="emit('click')"
  />
</template>
