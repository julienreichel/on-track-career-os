<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="t('settings.title')" :description="t('settings.subtitle')" />
      <UPageBody>
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold text-default">{{ t('settings.cv.title') }}</h2>
            <p class="text-sm text-dimmed">{{ t('settings.cv.description') }}</p>
            <UButton
              color="primary"
              variant="soft"
              icon="i-heroicons-arrow-right"
              :label="t('settings.cv.action')"
              to="/settings/cv"
            />
          </div>
        </UCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
