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
      variant="subtle"
      class="flex items-center gap-2 cursor-help"
      :data-testid="`badge-pill-${props.badge.id}`"
    >
      <UIcon :name="props.badge.icon" />
      <span>{{ t(props.badge.titleKey) }}</span>
    </UBadge>
  </UTooltip>
</template>
