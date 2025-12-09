<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">
        {{ t('profile.cvUpload.parsing.title') }}
      </h2>
    </template>

    <div class="flex flex-col items-center justify-center space-y-4 py-8">
      <USkeleton class="h-32 w-full" />
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-16 w-full" />
      
      <p class="text-gray-600 dark:text-gray-400 text-center">
        {{ t('profile.cvUpload.parsing.inProgress') }}
      </p>
    </div>
  </UCard>
</template>
