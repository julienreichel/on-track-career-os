<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { BadgeDefinition, BadgeId } from '@/domain/badges';
import BadgePill from '@/components/badges/BadgePill.vue';

const props = defineProps<{
  badges: BadgeDefinition[];
  newlyEarnedIds?: BadgeId[];
}>();

const { t } = useI18n();
</script>

<template>
  <UCard data-testid="badge-grid">
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{{ t('badges.title') }}</h2>
        <p class="text-sm text-dimmed">{{ t('badges.subtitle') }}</p>
      </div>

      <div v-if="props.badges.length === 0" class="text-sm text-dimmed">
        {{ t('badges.empty') }}
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <BadgePill
          v-for="badge in props.badges"
          :key="badge.id"
          :badge="badge"
          :is-new="props.newlyEarnedIds?.includes(badge.id)"
        />
      </div>
    </div>
  </UCard>
</template>
