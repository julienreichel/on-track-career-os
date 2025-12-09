<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  importCount: number;
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
        <UIcon name="i-lucide-check-circle" color="success" />
        <UText size="xl" weight="semibold">
          {{ t('cvUpload.importing') }}
        </UText>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert color="primary" :title="t('cvUpload.success', { count: importCount })" />

      <div class="flex flex-col sm:flex-row gap-3">
        <UButton
          :label="t('cvUpload.viewExperiences')"
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
