<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { BadgeDefinition } from '@/domain/badges';

const props = defineProps<{
  badge: BadgeDefinition;
}>();

const { t } = useI18n();
</script>

<template>
  <UTooltip :text="t(props.badge.descriptionKey)">
    <UBadge
      color="neutral"
      variant="outline"
      :icon="props.badge.icon"
      class="cursor-help"
      :data-testid="`badge-pill-${props.badge.id}`"
    >
      {{ t(props.badge.titleKey) }}
    </UBadge>
  </UTooltip>
</template>
