<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { GuidanceBanner as GuidanceBannerModel } from '@/domain/onboarding';

const props = defineProps<{
  banner: GuidanceBannerModel;
}>();

const { t } = useI18n();
</script>

<template>
  <UAlert
    icon="i-heroicons-information-circle"
    color="primary"
    variant="soft"
    :title="t(props.banner.titleKey)"
    :description="t(props.banner.descriptionKey)"
  >
    <template v-if="props.banner.cta" #actions>
      <UButton
        color="primary"
        variant="outline"
        :label="t(props.banner.cta.labelKey)"
        :to="props.banner.cta.to"
      />
    </template>
  </UAlert>
</template>
