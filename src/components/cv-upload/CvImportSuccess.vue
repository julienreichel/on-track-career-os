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
      <div class="flex items-center space-x-2">
        <UIcon name="i-lucide-check-circle" class="text-green-500" />
        <h2 class="text-xl font-semibold">
          {{ t('profile.cvUpload.success.title') }}
        </h2>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        color="primary"
        :title="t('profile.cvUpload.success.message')"
        :description="t('profile.cvUpload.success.imported', { count: importCount })"
      />

      <div class="flex flex-col sm:flex-row gap-3">
        <UButton
          :label="t('profile.cvUpload.success.viewProfile')"
          icon="i-lucide-user"
          @click="emit('viewProfile')"
        />
        <UButton
          :label="t('profile.cvUpload.success.viewExperiences')"
          icon="i-lucide-briefcase"
          variant="outline"
          @click="emit('viewExperiences')"
        />
      </div>
    </div>
  </UCard>
</template>
