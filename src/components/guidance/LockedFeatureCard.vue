<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { LockedFeature } from '@/domain/onboarding';

const props = defineProps<{
  feature: LockedFeature;
}>();

const { t } = useI18n();
</script>

<template>
  <UCard
    class="border-dashed border border-primary/30"
    :data-testid="`locked-feature-${props.feature.id}`"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <UBadge color="warning" variant="outline">
            <UIcon name="i-heroicons-lock-closed" class="w-3 h-3 mr-1" />
            {{ t('guidance.locked.badge') }}
          </UBadge>
          <h3 class="text-base font-semibold text-highlighted">
            {{ t(props.feature.titleKey) }}
          </h3>
        </div>
        <p class="text-sm text-dimmed">
          {{ t(props.feature.descriptionKey) }}
        </p>
      </div>
      <UButton
        color="primary"
        variant="soft"
        :label="t(props.feature.cta.labelKey)"
        :to="props.feature.cta.to"
      />
    </div>
  </UCard>
</template>
