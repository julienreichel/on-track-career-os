<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  createdCount: number;
  updatedCount: number;
}

defineProps<Props>();

const emit = defineEmits<{
  viewProfile: [];
  viewExperiences: [];
}>();
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-check-circle" class="text-success" />
        <h2 class="text-xl font-semibold">
          {{ t('cvUpload.importing') }}
        </h2>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        color="primary"
        :title="
          t('cvUpload.successSummary', {
            created: createdCount,
            updated: updatedCount,
          })
        "
      />

      <div class="flex flex-col sm:flex-row gap-3">
        <UButton
          :label="t('cvUpload.viewProfile')"
          icon="i-lucide-user"
          @click="emit('viewProfile')"
        />
        <UButton
          :label="t('cvUpload.viewExperiences')"
          icon="i-lucide-briefcase"
          variant="outline"
          @click="emit('viewExperiences')"
        />
      </div>
    </div>
  </UCard>
</template>
