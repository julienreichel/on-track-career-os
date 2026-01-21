<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const props = defineProps<{
  source?: string | null;
}>();

const { t } = useI18n();
const isSystem = computed(() => props.source?.startsWith('system:'));
const label = computed(() =>
  isSystem.value ? t('cvTemplates.source.system') : t('cvTemplates.source.user')
);
const color = computed(() => (isSystem.value ? 'neutral' : 'primary'));
</script>

<template>
  <UBadge :color="color" variant="soft">{{ label }}</UBadge>
</template>
