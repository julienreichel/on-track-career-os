<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { BadgeDefinition } from '@/domain/badges';
import BadgePill from '@/components/badges/BadgePill.vue';

const props = defineProps<{
  badges: BadgeDefinition[];
}>();

const { t } = useI18n();
</script>

<template>
  <UCard data-testid="badge-grid">
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{{ t('badges.grid.title') }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('badges.grid.description') }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <BadgePill v-for="badge in props.badges" :key="badge.id" :badge="badge" />
      </div>
    </div>
  </UCard>
</template>
