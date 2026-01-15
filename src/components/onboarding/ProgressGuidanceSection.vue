<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserProgress } from '@/composables/useUserProgress';
import ProgressBannerCard from '@/components/onboarding/ProgressBannerCard.vue';
import ProgressChecklistCard from '@/components/onboarding/ProgressChecklistCard.vue';

const { t } = useI18n();
const progress = useUserProgress();

onMounted(() => {
  void progress.load();
});
</script>

<template>
  <div class="space-y-4">
    <UAlert
      v-if="progress.error.value"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="soft"
      :title="t('progress.errors.title')"
      :description="t('progress.errors.loadFailed')"
    />

    <template v-if="progress.state.value && progress.nextAction.value">
      <ProgressBannerCard
        :state="progress.state.value"
        :next-action="progress.nextAction.value"
      />
      <ProgressChecklistCard :state="progress.state.value" />
    </template>
  </div>
</template>
