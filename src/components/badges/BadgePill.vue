<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { BadgeDefinition } from '@/domain/badges';

const props = defineProps<{
  badge: BadgeDefinition;
  isNew?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <UBadge
    :color="props.isNew ? 'primary' : 'neutral'"
    :variant="props.isNew ? 'soft' : 'subtle'"
    class="flex items-center gap-2"
    :data-testid="`badge-pill-${props.badge.id}`"
  >
    <UIcon :name="props.badge.icon" />
    <span>{{ t(props.badge.titleKey) }}</span>
    <span v-if="props.isNew" class="text-[10px] uppercase tracking-wide">
      {{ t('badges.new') }}
    </span>
  </UBadge>
</template>
